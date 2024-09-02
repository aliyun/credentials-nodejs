import 'mocha';
import assert from 'assert'

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

  it('should ok', async function () {
    const req = Request.builder().withHost('www.baidu.com').build();
    const res = await doRequest(req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/html');
    assert.ok(Buffer.isBuffer(res.body));
    assert.ok(res.body.length > 0);
  });

  it('should ok with queries', async function () {
    const req = Request.builder()
      .withHost('www.baidu.com')
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
      .withHost('www.baidu.com')
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
