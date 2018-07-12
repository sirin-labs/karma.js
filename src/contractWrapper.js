const debug = require('debug')('karma:contractWrapper');
const debugEvents = require('debug')('karma:channel_events');
const uuidv1 = require('uuid/v1');
const ContractArtifacts = require('./contract_artifacts.js');

let config = require('./dev_config');

/**
 * A JS wrapper for the contract methods
 */
class ContractWrapper {
    /**
     * A new channel instance is created if channelId is null
     * otherwise use an existing channel.
     * @param {string} senderAddress The first number.
     * @param {string} receiverAddress The second number.
     * @param {number} web3 The second number.
     * @param {number} channelId The second number.
     */
    constructor(senderAddress, receiverAddress, web3, channelId) {
        if (channelId === undefined) {
            this.channelId =
                '0x' +
                uuidv1()
                    .split('-')
                    .join('');
        } else {
            this.channelId = channelId;
        }
        // TODO: Production code shouldn't have this.
        this.gasMultiplier = config.getGasMultiplier();
        this.artifacts = new ContractArtifacts('Unidirectional');
        this.senderAddress = senderAddress;
        this.receiverAddress = receiverAddress;
        this.web3 = web3;
        this.contract = new this.web3.eth.Contract(this.artifacts.contractAbi, this.artifacts.contractAddress);
    }
    /**
     * Gets a delegate to a method by name
     * @param {string} methodName the methods name from solidity
     * @return {*} the instance of the js wrapper methods
     */
    methodNamefactory(methodName) {
        let method = methodName + '(' + this.artifacts.getParamsString(methodName) + ')';
        return this.contract.methods[method];
    }

    /**
     * handles promise and event sequence for web3 method.send
     * @param {string} methodName name for debug purposes
     * @param {*} parametered the delegate function to be called
     * @param {*} fromAddress Initiating wallet address
     * @param {*} value Tx value to be sent
     * @return {*} tx value
     */
    bodyFactory(methodName, parametered, fromAddress, value) {
        return new Promise((resolve, reject) => {
            debug(methodName, this.channelId, fromAddress, value);
            parametered.estimateGas({value: value, from: fromAddress})
                .then((gasAmount) => {
                    debug(methodName + ': Estimated GAS: ' + gasAmount);
                    return parametered
                        .send({from: fromAddress, value: value, gas: parseInt(gasAmount * this.gasMultiplier, 10)})
                        .on('transactionHash', function(hash) {
                            debugEvents(methodName + ': onTransactionHash: ' + hash);
                        })
                        .on('confirmation', function(confirmationNumber, receipt) {
                            debugEvents(methodName + ': onConfirmation: ' + confirmationNumber + ', ' + receipt.transactionHash);
                        })
                        .on('receipt', function(receipt) {
                            debugEvents(methodName + ': onReceipt: ');
                            debugEvents(receipt);
                        });
                })
                .then((value) => {
                    debug(methodName + ': onValue: ');
                    debug(value);
                    resolve(value);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    //
    // Payable Functions
    //
    // TODO: We already have receiverAddress in the constructor!

    /**
     * See solidity
     * @param {*} receiverAddress
     * @param {*} settlingPeriod
     * @param {*} initialValue
     * @return {*}
     */
    open(receiverAddress, settlingPeriod, initialValue) {
        // TODO: Validate input paramets
        let methodName = 'open';
        let parametered = this.methodNamefactory(methodName)(this.channelId, receiverAddress, settlingPeriod);
        return this.bodyFactory(methodName, parametered, this.senderAddress, initialValue);
    }
    /**
     * See solidity
     * @param {*} depositValue
     * @return {*}
     */
    deposit(depositValue) {
        // TODO: Validate input paramets
        let methodName = 'deposit';
        let parametered = this.methodNamefactory(methodName)(this.channelId);
        return this.bodyFactory(methodName, parametered, this.senderAddress, depositValue);
    }
    /**
     * See solidity
     * @param {*} payment
     * @param {*} signature
     * @return {*}
     */
    claim(payment, signature) {
        // TODO: Validate input paramet
        let methodName = 'claim';
        let parametered = this.methodNamefactory(methodName)(this.channelId, payment, signature);
        return this.bodyFactory(methodName, parametered, this.receiverAddress, 0);
    }
    /**
     * See solidity
     * @return {*}
     */
    settle() {
        // TODO: Validate input paramets
        let methodName = 'settle';
        let parametered = this.methodNamefactory(methodName)(this.channelId);
        return this.bodyFactory(methodName, parametered, this.senderAddress, 0);
    }
    /**
     * See solidity
     * @return {*}
     */
    startSettling() {
        // TODO: Validate input paramets
        let methodName = 'startSettling';
        let parametered = this.methodNamefactory(methodName)(this.channelId);
        return this.bodyFactory(methodName, parametered, this.senderAddress, 0);
    }
    //
    // View Functions
    //

    /**
     * See solidity
     * @return {*}
     */
    isAbsent() {
        // TODO: perform input validation.
        return this.contract.methods.isAbsent(this.channelId).call();
    }
    /**
     * See solidity
     * @return {*}
     */
    isPresent() {
        // TODO: perform input validation.
        return this.contract.methods.isPresent(this.channelId).call();
    }
    /**
     * See solidity
     * @return {*}
     */
    isSettling() {
        // TODO: perform input validation.
        return this.contract.methods.isSettling(this.channelId).call();
    }
    /**
     * See solidity
     * @return {*}
     */
    isOpen() {
        // TODO: perform input validation.
        return this.contract.methods.isOpen(this.channelId).call();
    }
    /**
     * See solidity
     * @param {*} originAddress
     * @return {*}
     */
    canDeposit(originAddress) {
        // TODO: perform input validation.
        return this.contract.methods.canDeposit(this.channelId, originAddress).call();
    }
    /**
     * See solidity
     * @param {*} originAddress
     * @return {*}
     */
    canStartSettling(originAddress) {
        // TODO: perform input validation.
        return this.contract.methods.canStartSettling(this.channelId, originAddress).call();
    }
    /**
     * See solidity
     * @return {*}
     */
    canSettle() {
        // TODO: perform input validation.
        return this.contract.methods.canSettle(this.channelId).call();
    }
    /**
     * See solidity
     * @param {*} payment
     * @param {*} originAddress
     * @param {*} signature
     * @return {*}
     */
    canClaim(payment, originAddress, signature) {
        // TODO: perform input validation.
        debug('a: ' + this.channelId + 'p: ' + payment);
        return this.contract.methods.canClaim(this.channelId, payment, originAddress, signature).call({from: this.receiverAddress});
    }
    /**
     * See solidity
     * @param {*} payment
     * @return {*}
     */
    paymentDigest(payment) {
        // TODO: perform input validation.
        return this.contract.methods.paymentDigest(this.channelId, payment).call();
    }
}

module.exports = ContractWrapper;
