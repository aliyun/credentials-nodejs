'use strict';

const providerChan = require('../lib/provider/provider_chan');


describe('ProviderChan', function () {
  it('should success', async function () {
    await providerChan.getCredentials();
  });
});


