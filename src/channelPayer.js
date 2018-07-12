const request = require('request-promise-native');
const debug = require('debug')('karma:sender');
const Web3 = require('web3');

const Channel = require('../src/contractWrapper.js');
const Payment = require('../src/payment.js');

/**
 * Client side for payee and the payment creator
 */
class ChannelPayer {
    /**
     * Creates a payer instance pairing with a payer
     * @param {string} payerAddress Payer's wallet address
     * @param {string} receiverUrl Url of payee's side
     * @param {Web3} web3 Web3 Provider
     * @param {ChannelPayerLogic} logic logic for payment sending
     */
    constructor(payerAddress, receiverUrl, web3, logic) {
        this.payerAddress = payerAddress;
        this.receiver_url = receiverUrl;
        this.web3 = web3;
        this.logic = logic;
        this.channel_id = null;
        this.receiver_address = null;
        this.channel = null;
    }

    // Private methods
    /**
     * Sends an http request
     * @param {*} endpoint http port
     * @param {*} body message bofy
     * @return {*} request
     */
    _sendRequest(endpoint, body) {
        let options = {
            method: 'POST',
            uri: this.receiver_url + '/' + endpoint,
            body: body,
            json: true
        };
        return request(options);
    }

    // Public methods
    /**
     * Sends a 'hello' message to receiver's URL and opens a smart contract
     * channel.
     * @param {*} initialValue Initial deposit in the escrow
     * @param {*} settlingPeriodBlocks settling time in Blocks
     * @return {Promise} transaction receipt
     */
    openChannel(initialValue, settlingPeriodBlocks) {
        this.settling_period_blocks = settlingPeriodBlocks;
        this.initialValueWei = Web3.utils.toWei(initialValue, 'ether');
        return new Promise((resolve, reject) => {
            this._sendRequest('hello', {
                sender_address: this.payerAddress,
                settling_period_blocks: this.settling_period_blocks
            })
                .then((body) => {
                    debug(body);
                    this.receiver_address = body.receiver_address;
                    this.channel_id = body.channel_id;
                    this.channel = new Channel(this.payerAddress, this.receiverAddress, this.web3, this.channel_id);
                    return this.channel.open(this.receiver_address, this.settling_period_blocks, this.initialValueWei);
                })
                .then((receipt) => {
                    resolve(receipt);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Creates and sends a payment to the payee
     * @param {BigNumber} value payment value in wei
     * @return {*} 'ok' on success
     */
    sendPayment(value) {
        return new Promise((resolve, reject) => {
            const valueWei = Web3.utils.toWei(value, 'ether');
            const pmnt = new Payment(this.payerAddress, this.receiver_address, this.channel_id, valueWei);
            pmnt.sign(this.channel)
                .then((signedPayment) => {
                    if (this.logic.shouldSend()) {
                        return this._sendRequest('proof', {
                            payment: signedPayment
                        });
                    } else {
                        reject('Send logic fail');
                    }
                })
                .then((response) => {
                    if (response.response === 'ok') {
                        resolve('ok');
                    }
                    reject('Proof: Error response from server.');
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}

module.exports = ChannelPayer;
