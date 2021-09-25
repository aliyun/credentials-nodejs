

import expect from 'expect.js';
import credentialsUriProvider from '../src/provider/credentials_uri_provider';
import mm from 'mm';
import 'mocha';
import assert from 'assert'
import URICredential from '../src/uri_credential';

describe('credentialsUriProvider with env ALIBABA_CLOUD_CREDENTIALS_URI exists', function () {
  describe('when it is empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_URI', '');
    });

    after(function () {
      mm.restore();
    });

    it('should return null', async function () {
      expect(credentialsUriProvider.getCredential()).to.be(null);
    });
  });

  describe('when is not empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_URI', 'http://localhost:3000/');
    });

    after(function () {
      mm.restore();
    });

    it('should success', async function () {
      assert.ok(credentialsUriProvider.getCredential() instanceof URICredential);
    });
  });
});
