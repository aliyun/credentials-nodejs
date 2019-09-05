'use strict';

const providerChan = require('../lib/provider/providerChan');


describe('ProviderChan', function () {
  it('should success', async function () {
    await providerChan.getCredentials();
  });
});


