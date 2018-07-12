module.exports = {
    package_name: 'StreamChannel',
    version: '0.0.1',
    description: 'Simple channel for streaming transactions',
    authors: ['Eyal Shani <eyals@sirinlabs.com>', 'Boris Feinstein <borisf@sirinlabs.com>'],
    keywords: ['ethereum', 'microtransactions', 'streaming'],
    networks: {
    	// Local ganache instance
        development: {
            host: '127.0.0.1',
            port: 7545,
            network_id: '5777'
        },
        // Whatever loom is syncing on...
        kovan: {
            host: '192.168.10.77',
            port: 8545,
            network_id: '42'
            // optional config values:
            // gas
            // gasPrice
            // from - default address to use for any transaction Truffle makes during migrations
            // provider - web3 provider instance Truffle should use to talk to the Ethereum network.
            //          - function that returns a web3 provider instance (see below.)
            //          - if specified, host and port are ignored.
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    mocha: {
        useColors: true
    }
};
