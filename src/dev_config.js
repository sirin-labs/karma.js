const Web3 = require('web3');
const truffleConfig = require('../truffle.js');

let network = process.env.NETWORK ? process.env.NETWORK : 'development';

module.exports.getNetworkId = function() {
    return truffleConfig.networks[network].network_id;
};

module.exports.getNetworkName = function() {
    return network;
};

module.exports.getWeb3 = function() {
    let host = truffleConfig.networks[network].host;
    let port = truffleConfig.networks[network].port;
    return new Web3(new Web3.providers.HttpProvider('http://' + host + ':' + port));
};

module.exports.getGasMultiplier = function() {
    let mult;

    switch (network) {
    case 'kovan':
    case 'ropsten':
        mult = 1;
        break;
    case 'development':
        mult = 2;
        break;
    default:
        mult = 1;
    }

    return mult;
};
