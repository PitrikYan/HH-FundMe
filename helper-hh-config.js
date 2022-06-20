const networkConfig = {
    31337: {
        name: "localhost",
    },
    // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
    // Default one is ETH/USD contract on Kovan
    42: {
        name: "kovan",
        ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    },
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
}

// tady urcime local chainy, kde se budou muset deploynout mocks !
const developmentChains = ["hardhat", "localhost"]

// constructor mocV3 - vstupy
const DECIMALS = "8"
const INITIAL_PRICE = "200000000000" // 2000

// diky tomuhle pak muzeme krasne importovat na zacatku scriptu
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
}
