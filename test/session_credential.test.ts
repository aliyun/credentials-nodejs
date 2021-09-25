import assert from "assert";
import Config from "../src/config";
import SessionCredential from "../src/session_credential";

describe('session credential', function () {
    it('custom session should ok', async function () {
        class MySessionCredential extends SessionCredential {
            
        }

        const credential = new MySessionCredential(new Config({}));
        try {
            await credential.getAccessKeyId();
        } catch (ex) {
            assert.strictEqual(ex.message, 'need implemented in sub-class');
            return;
        }
        assert.fail();
    });
});
