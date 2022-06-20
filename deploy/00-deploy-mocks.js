const { network } = require("hardhat")
const {
    developmentChains,
    INITIAL_PRICE,
    DECIMALS,
} = require("../helper-hh-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        // .includes -> zjisti zda pole obsahuje tuto promennou! pole vypada takto ["hardhat", "localhost"]
        // misto toho by stacilo i "if (chainId == "31337")"
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, // vypise info o deploy do logu (tx, address, gas)
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks Deployed!")
        log("------------------------------------------------")

        // NENI TO VSECHNO, NA GITHUB JSOU SOUBORY JINE.. ASI SE K TOMU DOSTANEM..
    }
}

module.exports.tags = ["all", "mocks"] // diky tomuhle muzu deploynout jen mocks a nebo "all" (vsude kde je all se deployne)
