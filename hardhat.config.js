require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// je dobre definovat "nebo" kdyby ty promene neexistovali (.env)
const RINKEBY_RPC_URL =
    process.env.RINKEBY_RPC_URL || "http://nejaka.jina.rpc.url"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x05fdsww33nejakyjinyprivatekey"
const ETHERSCAN_API = process.env.ETHERSCAN_API || "blabla"
const COINMARKETCAP_API = process.env.COINMARKETCAP_API || "blabla"

module.exports = {
    //solidity: "0.8.8",
    solidity: {
        compilers: [
            {
                version: "0.8.8",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY], // [] pole hodnot account
            chainId: 4,
            blockConfirmations: 6, // muzu si definovat pro kazdy chain
        },
    },
    gasReporter: {
        enabled: true, // ted je vyply
        //outputFile: "gas-report.txt",
        noColours: true,
        currency: "USD",
        //coinmarketcap: COINMARKETCAP_API,
        token: "BNB",
    },

    etherscan: {
        apiKey: ETHERSCAN_API,
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}
