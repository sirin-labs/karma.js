let debug = require('debug')('test:utils');
let chai = require('chai');
const keccak256 = require('js-sha3').keccak256;


const assert = chai.assert;
debug.enabled = true;

describe('Util/Signer ', async () => {
    describe('ethereumSign()', async () => {
        it('Should equal empty string hash', async () => {
            const retVal = keccak256('');
            assert.equal(retVal, 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
        });

        it('Should equal hello world hash', async () => {
            const retVal = keccak256('Hello world!');
            assert.equal(retVal, 'ecd0e108a98e192af1d2c25055f4e3bed784b5c877204e73219a5203251feaab');
        });
    });
});
