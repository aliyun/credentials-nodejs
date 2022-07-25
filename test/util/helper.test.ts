import {DEFAULT_UA} from '../../src/util/helper';
import pkg from '../../package.json';
import expect from 'expect.js';


it('should having version field', () => {
    expect(DEFAULT_UA).have.contain(pkg.version);
})
