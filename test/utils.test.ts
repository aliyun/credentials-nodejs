

import expect from 'expect.js';
import * as utils from '../src/util/utils';
import mm from 'mm';
import fs from 'fs';
import path from 'path';
import 'mocha';

describe('parseFile error', function () {
  before(function () {
    mm(fs, 'accessSync', function () {
      throw new Error();
    });
  });

  after(function () {
    mm.restore();
  });

  it('should return null when ignoreErr=true', function () {
    let content = utils.parseFile('test', true);
    expect(content).to.be(null);
  });

  it('should failed when ignoreErr=false', async function () {
    expect(function () {
      utils.parseFile('test', false);
    }).throwException(/Has no read permission to credentials file/);
  });
});

describe('parseFile with valid filePath', function () {
  it('should success', async function () {
    let filePath = path.join(__dirname, './fixtures/credentials');
    let content = await utils.parseFile(filePath, true);
    expect(content).to.have.property('default');
  });
});
