const EthUnits = require('ethereumjs-units');
// const BigNumber = require('bignumber.js');

/**
 * asd
 * @param {*} value
 * @param {*} fromUnit
 * @param {*} toUnit
 * @return {string}
 */
function convertRetString(value, fromUnit, toUnit) {
    let stringNumber = EthUnits.convert(value.toString(), fromUnit, toUnit);
    return stringNumber;
}

module.exports.convertRetString = convertRetString;
