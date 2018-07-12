let debug = require('debug')('test:channel');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Contract = require('../src/contractWrapper.js');
let config = require('../src/dev_config.js');

chai.use(chaiAsPromised);

chai.should();
debug.enabled = true;

describe('02_Channel Library Payable Functions (Sender Settles Flow)', function() {
    let senderAccount;
    let receiverAccount;
    let contract;
    let web3 = config.getWeb3();

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
            let initialDepositAmount = '0.003';
            let settlingPeriodBlocks = 0;
            contract.open(receiverAccount, settlingPeriodBlocks, web3.utils.toWei(initialDepositAmount, 'ether'))
                .should.eventually.nested.include({'events.didOpen.event': 'didOpen'})
                .notify(done);
        });
    });

    describe('Channel.settle()', function() {
        it('Should emit didSettle event', function(done) {
            contract.settle()
                .should.eventually.nested.include({'events.didSettle.event': 'didSettle'})
                .notify(done);
        });
    });
});
