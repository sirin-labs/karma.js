/**
 * An interface for logic classes
 * The logic is supposed to reflect the current amount
 * of resource recieved and hence implemented on the third tier
 */
class ChannelPayerLogic {
    /**
     * Interface meant to be inherited
     * @return {boolean} true if should Payer send payment, false otherwise
     */
    shouldSend() {
        let flag = true;
        return flag;
    }
}

module.exports = ChannelPayerLogic;
