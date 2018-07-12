const chai = require('chai');
const debug = require('debug')('test:protocol');
const chaiAsPromised = require('chai-as-promised');
const ChannelPayee = require('../src/channelPayee.js');
const ChannelPayer = require('../src/channelPayer.js');
const PayerLogic = require('../src/channelPayerLogic.js');
const config = require('../src/dev_config.js');
const chaiEvents = require('chai-events');
const PaymentValidator = require('../src/paymentValidator.js');

chai.use(chaiAsPromised);
chai.use(chaiEvents);
chai.should();

describe('04_Channel Protocol Tests', function() {
    let payee = null;
    let payer = null;
    let senderAccount = null;
    let receiverAccount = null;
    let web3 = null;
    let waitTimeMsec = 1500;
    let logic = new PayerLogic();

    before(function(done) {
        web3 = config.getWeb3();
        web3.eth.getAccounts()
            .then(function(accounts) {
                senderAccount = accounts[0];
                receiverAccount = accounts[1];
                debug(senderAccount);
                debug(receiverAccount);
                done();
            })
            .catch(done);
    });

    it('should create Receiver instance', function(done) {
        const validator = new PaymentValidator();
        payee = new ChannelPayee(receiverAccount, web3, validator);
        payee.startSharingResource();
        payee.should.exist;
        done();
    });

    it('should create Sender instance', function(done) {
        payer = new ChannelPayer(senderAccount, 'http://localhost:8080', web3, logic);
        payer.should.exist;
        done();
    });

    it('should open a channel', function(done) {
        payer.openChannel('0.03', 0).should.eventually.nested.include({'events.didOpen.event': 'didOpen'}).notify(done);
    });

    it('should send proof #1 to receiver and wait a little', function(done) {
        payee.should.emit('paymentReceived');
        payer.sendPayment('0.01').should.eventually.equal('ok');
        setTimeout(done, waitTimeMsec);
    });

    it('should not emit payment arrival event', function(done) {
        payee.should.not.emit('paymentReceived');
        setTimeout(done, waitTimeMsec);
    });

    it('should send proof #2 to receiver and wait a little', function(done) {
        payer.sendPayment('0.02').should.eventually.equal('ok');
        setTimeout(done, waitTimeMsec);
    });

    it('should send proof #3 to receiver and wait a little', function(done) {
        payer.sendPayment('0.03').should.eventually.equal('ok');
        setTimeout(done, waitTimeMsec);
    });

    it('should claim channel value with latest proof value (0.03)', function(done) {
        payee.stopSharingResource().should.eventually.equal('ok').notify(done);
    });

    after(function(done) {
        done();
    });
});
