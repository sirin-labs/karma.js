const jsonfile = require('jsonfile');
const assert = require('assert');
const debug = require('debug')('karma:contract_artifacts');
const devConfig = require('./dev_config');

debug.enabled = true;

/**
 * Handles contract ABI and artifacts
 * @param {*} contractName
 */
function ContractArtifacts(contractName) {
    // Parse deployed contract's artifacts JSON.
    let file = './build/contracts/' + contractName + '.json';
    let json = jsonfile.readFileSync(file);
    assert(json);

    // Default to 'development' network.
    this.network = devConfig.getNetworkId();
    this.contractAbi = json.abi;
    this.contractAddress = json.networks[this.network].address;
    this.payableFunctions = this.contractAbi.filter((item) => !item.constant && item.type == 'function');
    this.payableFunctionParams = this.payableFunctions.map((a) => a.inputs.map((b) => b.type).join());
}

ContractArtifacts.prototype.getParamsString = function(functionName) {
    return this.payableFunctionParams[this.payableFunctions.findIndex((i) => i.name == functionName)];
};

module.exports = ContractArtifacts;
