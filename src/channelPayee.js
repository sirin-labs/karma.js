const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan-debug');
const debug = require('debug')('karma:channelPayee');
const keccak256 = require('js-sha3').keccak256;
const EventEmitter = require('events').EventEmitter;

const Channel = require('../src/contractWrapper.js');
const Payment = require('../src/payment.js');

/**
 * ChanelPayee manages payments communication
 */
class ChannelPayee extends EventEmitter {
    /**
     * Creates a new instance. Each instance is
     * supposed to manage the sharing is one resource
     * @param {string} payeeAddress the wallet address of the payee
     * @param {Web3} web3 Web3 provider
     * @param {PaymentValidator} validator logic object
     */
    constructor(payeeAddress, web3, validator) {
        super();
        this.port = '8080';
        this.payeeAddress = payeeAddress;
        this.lastValidProof = null;
        this.web3 = web3;
        this.channel = null;
        this.validator = validator;
    }

    // Private Functions
    /**
     * Closes the channel on the blockchain and distributes the funds
     * @return {Promise} 'ok' on success
     */
    _claimChannel() {
        if (!this.channel) {
            this.channel = new Channel(this.senderAddress, this.payeeAddress, this.web3, this.channelId);
        }
        return new Promise((resolve, reject) => {
            let lastPayment = this.lastValidProof;
            debug('Last proof: ');
            debug(lastPayment.toSerialized());
            this.channel.claim(lastPayment.value, lastPayment.signed)
                .then((receipt) => {
                    resolve('ok');
                })
                .catch((error) => {
                    reject(error);
                });
            resolve('ok');
        });
    }

    /**
     * Manages the initial handshake of the protocol
     * @param {*} req http request
     * @param {*} res http response
     */
    _onHello(req, res) {
        debug('received hello: ' + req.body);
        this.senderAddress = req.body.sender_address;
        this.channelId = '0x' + keccak256(this.senderAddress + this.payeeAddress);
        res.json({
            receiver_address: this.payeeAddress,
            stream_data_unit: 'wei',
            stream_payment_unit: 'kB',
            stream_payment_currency: 'ETH',
            stream_data_payment_ratio: '5',
            channel_id: this.channelId
        });
        this.emit('channelCreated', this.channelId);
    }
    /**
     * Validates an incoming proof and stores it the valid case
     * @param {*} req http request
     * @param {*} res http response
     */
    _onProof(req, res) {
        if (!this.channel) {
            this.channel = new Channel(this.senderAddress, this.payeeAddress,
                this.web3, this.channelId);
        }
        debug('received payment proof: ' + req.body);
        let payment = Payment.deserialize(req.body['payment']);
        this.validator.validateWithChannelOnChain(this.channel, payment)
            .then((isValid) => {
                if (isValid) {
                    this.lastValidProof = payment;
                    debug('Proofs: ' + payment.toString());
                    res.json({
                        response: 'ok'
                    });
                    this.emit('paymentReceived', payment);
                } else {
                    debug('validation failed');
                }
            })
            .catch((error) => {
                debug(error);
            });
    }

    // Public functions
    /**
     * Starts the server and opens a channel
     */
    startSharingResource() {
        // Create an instance of an express server for incoming messages.
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(morgan('karma:receiver', 'common'));
        this.app.post('/hello', this._onHello.bind(this));
        this.app.post('/proof', this._onProof.bind(this));
        this.app.server = this.app.listen(this.port, () => {
            debug('Receiver is ready at http://localhost:' + this.port);
        });
    }
    /**
     * Stops the server and closes the channel
     * @return {Promise} 'ok' on success
     */
    stopSharingResource() {
        return new Promise((resolve, reject) => {
            debug('Payee:\tClosing Channel: ');
            this.app.server.close(() => {
                debug('Receiver closed.');
            });
            this._claimChannel()
                .then((receipt) => {
                    resolve('ok');
                })
                .catch((error) => {
                    reject(error);
                });
            resolve('ok');
        });
    }
}

module.exports = ChannelPayee;
