var UnidirectionalChannel = artifacts.require('./Unidirectional.sol');

module.exports = function(deployer) {
  deployer.deploy(UnidirectionalChannel);
};
