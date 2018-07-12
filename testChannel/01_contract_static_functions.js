let debug = require('debug')('test:channel');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let Contract = require('../src/contractWrapper.js');
let config = require('../src/dev_config.js');

chai.use(chaiAsPromised);

chai.should();
debug.enabled = true;

describe('01_contract Library Static Functions (Dummy Input)', function() {
    beforeEach(function(done) {
        done();
    });

    let contract = new Contract('0x001e8e86392143e78a0790b98ca0664786910ce1',
        '0x001e8e86392143e78a0790b98ca0664786910ce1',
        config.getWeb3());
    let dummySourceAccount = '0x001e8e86392143e78a0790b98ca0664786910ce1';

    describe('Channel.isAbsent()', function() {
        it('Should return true', function(done) {
            contract.isAbsent().should.eventually.be.true.notify(done);
        });
    });

    describe('Channel.isPresent()', function() {
        it('Should return false', function(done) {
            contract.isPresent().should.eventually.be.false.notify(done);
        });
    });

    describe('Channel.canSettle()', function() {
        it('Should return false', function(done) {
            contract.canSettle().should.eventually.be.true.notify(done);
        });
    });

    describe('Channel.canClaim()', function() {
        it('Should return false', function(done) {
            let dummyPayment = '0x6756';
            let dummySig = '0x2323';
            contract.canClaim(dummyPayment, dummySourceAccount, dummySig).should.eventually.be.false.notify(done);
        });
    });
});
