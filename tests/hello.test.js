const assert = require('assert');

describe('Hello Test', () => {
    it('should return true for a valid condition', () => {
        assert.strictEqual(true, true);
    });

    it('should return the correct sum', () => {
        assert.strictEqual(1 + 1, 2);
    });

    it('should return false for an invalid condition', () => {
        assert.strictEqual(false, false);
    });
});