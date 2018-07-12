/**
 * A class that is meant to be inherited by the third tier to implement custon
 * validation per use-case
 */
class PaymentValidator {
    /**
     * Validating that the on-chain contract will not reject the payment
     * @param {*} contract The contract wrapper
     * @param {*} payment Payment object to validate
     * @return {Promise} isValid
     */
    validateWithChannelOnChain(contract, payment) {
        return contract.canClaim(payment.value, payment.payee, payment.signed);
    }
}

module.exports = PaymentValidator;
