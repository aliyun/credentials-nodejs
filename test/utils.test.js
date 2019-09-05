'use strict';

const expect = require('expect.js');
const utils = require('../lib/util/utils');
const mm = require('mm');
const fs = require('fs');
const path = require('path');


describe('parseFile error', function () {
  before(function () {
    mm(fs, 'accessSync', function () {
      throw new Error();
    });
  });
  after(function () {
    mm.restore();
  });
  it('should return null when ignoreErr=true', async function () {
    let content = await utils.parseFile('test', true);
    expect(content).to.be(null);
  });
  it('should faild when ignoreErr=false', async function () {
    expect(function () {
      utils.parseFile('test', false);
    }).throwException(/Has no read permission to credentials file/);
  });
});
describe('parseFile with valid filePath', function () {
  before(function () {
  });
  after(function () {
    mm.restore();
  });
  it('should success', async function () {
    let filePath = path.join(__dirname, './fixtures/credentials');
    let content = await utils.parseFile(filePath, true);
    expect(content).to.be.ok();
  });
});



