import 'mocha';
import assert from 'assert'

import {Request, doRequest} from '../../src/providers/http';

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
