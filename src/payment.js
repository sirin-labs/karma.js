const debug = require('debug')('karma:payment');

/**
 * Represent a payment which is being sent over the channel
 */
class Payment {
    /**
     * Creates the struct
     * @param {*} payer Payer wallet address
     * @param {*} payee Payee wallet address
     * @param {*} channelId The underlying channel ID
     * @param {*} value Value represented in this payment
     * @param {*} signed default is null, the signed payment
     */
    constructor(payer, payee, channelId, value, signed = null) {
        this.payer = payer;
        this.payee = payee;
        this.channelId = channelId;
        this.value = value;
        this.signed = signed;
    }

    /**
     * Turns the object into a JSON
     * @return {string} A JSON string
     */
    toSerialized() {
        return {
            payer: this.payer,
            payee: this.payee,
            channelId: this.channelId,
            value: this.value,
            signed: this.signed
        };
    }

    /**
     * Turns a payment JSON into an object
     * @param {string} paymentJson The payment string
     * @return {Payment} The payment object
     */
    static deserialize(paymentJson) {
        debug(paymentJson['channelId']);
        const s = paymentJson['payer'];
        const r = paymentJson['payee'];
        const c = paymentJson['channelId'];
        const v = paymentJson['value'];
        const signed = paymentJson['signed'];
        return new Payment(s, r, c, v, signed);
    }
    /**
     * Signs the payment using the contract
     * @param {*} contract contract instance
     * @return {Promise} A promise for the signed tx
     */
    sign(contract) {
        return new Promise((resolve, reject) => {
            contract.paymentDigest(this.value)
                .then((digest) => {
                    return contract.web3.eth.sign(digest, this.payer);
                })
                .then((signedDigest)=> {
                    this.signed = signedDigest;
                    resolve(this);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}

module.exports = Payment;
