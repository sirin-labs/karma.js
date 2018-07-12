let debug = require('debug')('test:channel');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Contract = require('../src/contractWrapper.js');
let config = require('../src/dev_config.js');

chai.use(chaiAsPromised);

chai.should();
let assert = chai.assert;

describe('03_Channel Library Payable Functions (Receiver Claims Flow)', function() {
    let initialDepositAmount = '0.003';
    let settlingPeriodBlocks = 1;

    let senderAccount;
    let receiverAccount;
    let contract;
    let web3 = config.getWeb3();
    let digest = null;
    let signature = null;

    before(function(done) {
        web3.eth.getAccounts()
            .then(function(accounts) {
                senderAccount = accounts[0];
                receiverAccount = accounts[1];
                contract = new Contract(senderAccount, receiverAccount, web3);
                done();
            })
            .catch(done);
    });

    describe('Channel.open()', function() {
        it('Should emit didOpen event', function(done) {
            contract.open(receiverAccount, settlingPeriodBlocks, web3.utils.toWei(initialDepositAmount, 'ether'))
                .should.eventually.nested.include({'events.didOpen.event': 'didOpen'})
                .notify(done);
        });
    });

    describe('Sender signs - creates a digest and signs it', function() {
        specify('Should create a valid signature', async function() {
            let amountWei = web3.utils.toWei(initialDepositAmount, 'ether');
            digest = await contract.paymentDigest(amountWei);
            signature = await web3.eth.sign(digest, senderAccount);
            debug(digest);
            debug(signature);
            assert.exists(digest);
            assert.exists(signature);
        });
    });

    describe('Channel.canClaim()', function() {
        it('Should return true', function(done) {
            contract.canClaim(web3.utils.toWei(initialDepositAmount, 'ether'), receiverAccount, signature).should.eventually.be.true.notify(done);
        });
    });

    describe('Channel.claim()', function() {
        it('Should emit didClaim event', function(done) {
            contract.claim(web3.utils.toWei(initialDepositAmount, 'ether'), signature)
                .should.eventually.nested.include({'events.didClaim.event': 'didClaim'})
                .notify(done);
        });
    });
});
