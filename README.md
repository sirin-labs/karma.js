# Karma
Karma - A Deterministic State Channel Implementation for P2P Resource Streaming on the Ethereum Network.

## Motivation
The Ethereum network allows for decentralized value transfer between any two peers without an intermediary party.
Cool. But each transfer or contract excecution costs GAS. What if we'd like to perform 1K transfers in a minute?

The FINNEY mobile device will allow any two users to share resources between them. They can share their WiFi connection, data plan, battery... But if each transfer costs GAS, then how do we avoid the high transfer costs?

That's where state channels come in! Instead of performing all transfers on-chain, we'll open a **Karma** channel between the two FINNEY devices. This will allow them to send an unlimited amount of transactions, free of GAS, between themselves via an off-chain message-based protocol. They'll only need to pay for openning the channel and the occasional withdrawal of funds.

And now, the science.

## The Science
lorem ipsum

## Installation
* Install truffle: `sudo npm install -g truffle`.
* Install [ganache][ganache].
* run `npm install` from repo diretectory.

## Usage

### Contract Deployment
* Ethereum Node Emulation: Run ganache (also possible to excute `truffle develop` in another window).
* Deploy contracts: `truffle deploy --reset`.

### Runnig Tests
* Contracts: `truffle test`.
* Karma: `npm test`.

### Debug Flags
* `export DEBUG=karma:*`

Made with ![heart][heart] by **SIRIN LABS**

[heart]: https://static.xx.fbcdn.net/images/emoji.php/v9/f6c/1/16/2764.png "Heart"
[ganache]: https://truffleframework.com/ganache