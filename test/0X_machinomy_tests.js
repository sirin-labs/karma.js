require('dotenv').config();
const Units = require('./utils/units.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const truffleAssert = require('truffle-assertions');
const ethUtil = require('ethereumjs-util');

const Unidirectional = artifacts.require('Unidirectional');

chai.use(chaiAsPromised);
const wltHost = process.env.NETWORK_HOST;
const wltPort = process.env.NETWORK_PORT;
const wltUri = 'http://' + wltHost + ':' + wltPort;
const web3 = new Web3(new Web3.providers.HttpProvider(wltUri));

const WRONG_CHANNEL_ID = '0xdeadbeaf';
const WRONG_SIGNATURE = '0xcafebabe';

contract('Unidirectional', async (accounts) => {
    const sender = accounts[0];
    const receiver = accounts[1];
    const alien = accounts[2];
    const channelValue = Units.convertRetString(1, 'eth', 'wei');
    const bnChannelValue = new BigNumber(channelValue);
    const settlingPeriod = 0;
    const paymentStr = Units.convertRetString(0.1, 'eth', 'wei');
    const payment = new BigNumber(paymentStr);
    let instance;

    /**
     *
     * @param {*} channelId
     * @param {*} _settlingPeriod
     * @return {*} asd
     */
    async function createChannelRaw(channelId, _settlingPeriod = settlingPeriod) {
        let options = {
            from: sender,
            value: Units.convertRetString(1, 'eth', 'wei')
        };
        return instance.open(channelId, receiver, _settlingPeriod, options);
        // Change settlingPeriod to BigNumber
    }

    /**
     * Generates a random number
     * @param {*} digits
     * @return {*} a random number
     */
    function randomId(digits = 3) {
        const datePart = new Date().getTime() * Math.pow(10, digits);
        const extraPart = Math.floor(Math.random() * Math.pow(10, digits)); // 3 random digits
        return datePart + extraPart; // 16 digits
    }

    /**
     *
     * @param {*} sender
     * @param {*} receiver
     * @return {*}
     */
    function randomChannelId(sender, receiver) {
        let random = randomId();
        let buffer = ethUtil.sha3(sender + receiver + random);
        return ethUtil.bufferToHex(buffer);
    }

    /**
     * Calculates the actual gas used for a given tx
     * @param {*} web3
     * @param {*} log
     * @return {BigNumber} actual gas used
     */
    async function txPrice(web3, log) {
        const tx = await web3.eth.getTransaction(log.tx);
        const gasPrice = new BigNumber(tx.gasPrice);
        const gasUsed = new BigNumber(log.receipt.gasUsed);
        return gasPrice.times(gasUsed);
    }

    /**
     *
     * @param {string} sender
     * @param {string} channelId
     * @param {BigNumber} payment
     * @return {string}
     */
    async function paymentSignature(sender, channelId, payment) {
        let digest = await instance.paymentDigest(channelId, payment.toString());
        return web3.eth.sign(digest, sender);
    }
    before(async () => {
        instance = await Unidirectional.new();
    });

    describe('.open', () => {
        specify('emit DidOpen event', async () => {
            const channelId = randomChannelId(sender, receiver);
            let tx = await createChannelRaw(channelId);
            truffleAssert.eventEmitted(tx, 'didOpen', (ev) => {
                let flag = ev.channelId == channelId && ev.sender == sender && ev.receiver == receiver;
                const retValueStr = ev.value.toString();
                const givenValStr = Units.convertRetString(1, 'eth', 'wei');
                flag = flag && retValueStr == givenValStr;
                return flag;
            });
        });

        specify('open channel', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            const channels = await instance.channels;
            const channel = await channels(channelId);
            assert.equal(channel[0], sender);
            assert.equal(channel[1], receiver);
            assert.equal(channel[2].toString(), channelValue.toString());
            assert.equal(channel[3].toString(), settlingPeriod.toString());

            assert.isTrue(await instance.isPresent(channelId));
            assert.isFalse(await instance.isAbsent(channelId));
        });

        specify('increase contract balance', async () => {
            const curAddress = instance.address;
            const before = new BigNumber(await web3.eth.getBalance(curAddress));
            await createChannelRaw(randomChannelId(sender, receiver));
            const after = new BigNumber(await web3.eth.getBalance(curAddress));
            const delta = after.minus(before);
            assert.isTrue(delta.isEqualTo(bnChannelValue));
        });

        specify('decrease sender balance', async () => {
            const before = new BigNumber(await web3.eth.getBalance(sender));
            const channelId = randomChannelId(sender, receiver);
            const log = await createChannelRaw(channelId);
            const after = new BigNumber(await web3.eth.getBalance(sender));
            const txCost = await txPrice(web3, log);
            const actual = after.minus(before);
            const expected = bnChannelValue.plus(txCost).negated();
            assert.isTrue(actual.isEqualTo(expected));
        });

        specify('respect previous channelId', async () => {
            const channelId = randomChannelId(sender, receiver);
            let flag = false;
            await createChannelRaw(channelId);
            try {
                await createChannelRaw(channelId);
            } catch (e) {
                flag = true;
            }
            assert.isTrue(flag);
        });
    });

    describe('.claim', () => {
        /**
         * asd
         * @param {string} channelId
         * @return {*}
         */
        async function openAndClaim(channelId) {
            await createChannelRaw(channelId);
            const signature = await paymentSignature(sender, channelId, payment);
            return instance.claim(channelId, paymentStr, signature, {from: receiver});
        }

        specify('emit DidClaim event', async () => {
            const channelId = randomChannelId(sender, receiver);
            const tx = await openAndClaim(channelId);
            truffleAssert.eventEmitted(tx, 'didClaim');
        });
        specify('remove channel', async () => {
            const channelId = randomChannelId(sender, receiver);
            await openAndClaim(channelId);

            const channels = await instance.channels;
            const channel = await channels(channelId);

            assert.equal(channel[0], '0x0000000000000000000000000000000000000000');
            assert.equal(channel[1], '0x0000000000000000000000000000000000000000');
            assert.equal(channel[2].toString(), '0');
            assert.equal(channel[3].toString(), '0');
            assert.equal(channel[4].toString(), '0');

            assert.isTrue(await instance.isAbsent(channelId));
            assert.isFalse(await instance.isPresent(channelId));
        });
        specify('decrease contract balance', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            let before = new BigNumber(await web3.eth.getBalance(instance.address));
            let signature = await paymentSignature(sender, channelId, payment);
            await instance.claim(channelId, paymentStr, signature, {from: receiver});
            let after = new BigNumber(await web3.eth.getBalance(instance.address));
            let delta = before.minus(after);
            assert.isTrue(delta.isEqualTo(channelValue));
        });
        specify('send money to receiver', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            const signature = await paymentSignature(sender, channelId, payment);
            const before = new BigNumber(await web3.eth.getBalance(receiver));
            const tx = await instance.claim(channelId, paymentStr, signature, {from: receiver});
            const txCost = await txPrice(web3, tx);
            const after = new BigNumber(await web3.eth.getBalance(receiver));
            const delta = after.minus(before).plus(txCost);
            assert.isTrue(delta.isEqualTo(payment));
        });
        specify('send channel value to receiver', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);

            const _payment = bnChannelValue.plus(payment);
            const signature = await paymentSignature(sender, channelId, _payment);
            const before = new BigNumber(await web3.eth.getBalance(receiver));
            const tx = await instance.claim(channelId, _payment.toString(), signature, {from: receiver});
            const txCost = await txPrice(web3, tx);
            const after = new BigNumber(await web3.eth.getBalance(receiver));
            const delta = after.minus(before).plus(txCost);
            assert.isTrue(delta.isEqualTo(bnChannelValue));
        });
        specify('send change to sender', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);

            const signature = await paymentSignature(sender, channelId, payment);
            const before = new BigNumber(await web3.eth.getBalance(sender));
            await instance.claim(channelId, paymentStr, signature, {from: receiver});
            const after = new BigNumber(await web3.eth.getBalance(sender));
            const delta = after.minus(before);
            assert.isTrue(delta.isEqualTo(bnChannelValue.minus(payment)));
        });
        specify('refuse if sender', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);

            const signature = await paymentSignature(sender, channelId, payment);
            const before = new BigNumber(await web3.eth.getBalance(sender));
            await instance.claim(channelId, paymentStr, signature, {from: receiver});
            const after = new BigNumber(await web3.eth.getBalance(sender));
            const delta = after.minus(before);
            assert.isTrue(delta.isEqualTo(bnChannelValue.minus(payment)));
        });
        specify('refuse if alien', async () => {
            let flag = false;
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);

            const signature = await paymentSignature(sender, channelId, payment);
            try {
                await instance.claim(channelId, paymentStr, signature, {from: alien});
            } catch (e) {
                flag = true;
            }
            assert.isTrue(flag);
        });
        specify('refuse if no channel', async () => {
            let flag = false;
            const signature = await paymentSignature(sender, WRONG_CHANNEL_ID, payment);
            try {
                await instance.claim(WRONG_CHANNEL_ID, payment, signature, {from: receiver});
            } catch (e) {
                flag = true;
            }
            return assert.isTrue(flag);
        });
        specify('refuse if wrong signature', async () => {
            let flag = false;
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            try {
                await instance.claim(channelId, paymentStr, WRONG_SIGNATURE, {from: receiver});
            } catch (e) {
                flag = true;
            }
            return assert.isTrue(flag);
        });
    });

    describe('.settle', () => {
        specify('emit DidSettle event', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            const tx = await instance.settle(channelId);
            truffleAssert.eventEmitted(tx, 'didSettle');
        });
        specify('send money to sender', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);

            const before = new BigNumber(await web3.eth.getBalance(sender));
            const tx = await instance.settle(channelId);
            const txCost = await txPrice(web3, tx);
            const after = new BigNumber(await web3.eth.getBalance(sender));
            const actual = after.minus(before);
            const curChan = bnChannelValue.minus(txCost);
            assert.isTrue(actual.isEqualTo(curChan));
        });
        specify('remove channel', async () => {
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId);
            await instance.settle(channelId);

            assert.isTrue(await instance.isAbsent(channelId));
            assert.isFalse(await instance.isPresent(channelId));
        });
        specify('refuse if still settling', async () => {
            let flag = false;
            const settlingPeriod = 30;
            const channelId = randomChannelId(sender, receiver);
            await createChannelRaw(channelId, settlingPeriod);

            try {
                await instance.settle(channelId, {from: sender});
            } catch (e) {
                flag = true;
            }
            assert.isTrue(flag);
        });
    });
});
