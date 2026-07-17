import 'mocha';
import assert from 'assert'
import http, { Server } from 'http';

import {Request, doRequest} from '../../src/providers/http';

describe('Request', function () {
  it('should ok with defaults', async function () {
    const req = Request.builder().build();
    // check default values
    assert.strictEqual(req.protocol, 'https');
    assert.strictEqual(req.path, '/');
    assert.deepStrictEqual(req.queries, {});
    assert.deepStrictEqual(req.headers, {});
  });

  it('should ok with values', async function () {
    const req = Request.builder()
      .withProtocol('https')
      .withHost('www.baidu.com')
      .withPath('/path')
      .withQueries({'key': 'value'})
      .withHeaders({'content-type': 'value'})
      .build();
    // check default values
    assert.strictEqual(req.protocol, 'https');
    assert.strictEqual(req.path, '/path');
    assert.deepStrictEqual(req.queries, {'key': 'value'});
    assert.deepStrictEqual(req.headers, {'content-type': 'value'});
  });
});

describe('doRequest', function () {
  let server: Server;
  let host: string;

  before(function (done) {
    server = http.createServer((_req, res) => {
      res.writeHead(200, {'content-type': 'text/html'});
      res.end('<html>ok</html>');
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        done(new Error('test server did not bind to a TCP port'));
        return;
      }
      host = `127.0.0.1:${address.port}`;
      done();
    });
  });

  after(function (done) {
    server.close(done);
  });

  it('should ok', async function () {
    const req = Request.builder().withProtocol('http').withHost(host).build();
    const res = await doRequest(req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/html');
    assert.ok(Buffer.isBuffer(res.body));
    assert.ok(res.body.length > 0);
  });

  it('should ok with queries', async function () {
    const req = Request.builder()
      .withProtocol('http')
      .withHost(host)
      .withQueries({'key': 'value'})
      .build();
    const res = await doRequest(req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/html');
    assert.ok(Buffer.isBuffer(res.body));
    assert.ok(res.body.length > 0);
  });

  it('should ok with headers', async function () {
    const req = Request.builder()
      .withProtocol('http')
      .withHost(host)
      .withQueries({'key': 'value'})
      .withHeaders({'key': 'value'})
      .build();
    const res = await doRequest(req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/html');
    assert.ok(Buffer.isBuffer(res.body));
    assert.ok(res.body.length > 0);
  });
});
