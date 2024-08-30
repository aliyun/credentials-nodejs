import assert from 'assert';
import { parseUTC } from '../../src/providers/time';

describe('parseUTC', function () {
  it('should ok', function () {
    assert.strictEqual(parseUTC('2015-04-09T11:52:19Z'), 1428580339000);
    assert.strictEqual(parseUTC('2024-08-30T07:03:06.117Z'), 1725001386117);
  });

  it('should not ok with invalid date', function () {
    assert.throws(() => {
      parseUTC('');
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid UTC format time string');
      return true;
    });

    assert.throws(() => {
      parseUTC(undefined);
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid UTC format time string');
      return true;
    });

    assert.throws(() => {
      parseUTC('test');
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid UTC format time string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024_xx_xxtxx.xx.xxz')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid UTC format date string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024_xx_xxtxx.xx.xx.xxxz')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid UTC format date string');
      return true;
    });

    assert.throws(() => {
      parseUTC('tttt-xx-xxTxx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid year string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-xx-xxTxx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid month string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-13-xxTxx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid month value');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-xxTxx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid date string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-99Txx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid date value');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31Txx:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid hours string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T99:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid hours value');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T09:xx:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid minutes string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T09:99:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid minutes value');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T09:30:xxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid seconds string');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T09:30:99Z')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid seconds value');
      return true;
    });

    assert.throws(() => {
      parseUTC('2024-08-31T09:30:01.xxxZ')
    }, (err: Error) => {
      assert.strictEqual(err.message, 'invalid ms string');
      return true;
    });
  });
});
