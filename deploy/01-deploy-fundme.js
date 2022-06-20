// normalne by byly imports a main fce (main nebude)

const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hh-config") // tohle je to same jako toto: (akorat na jednom radku vytahneme primo tu promennou)
//const helperConfig = require("../helper-hh-config") - cely soubor
//const networkConfig = helperConfig.networkConfig - vytahnuti promenne

const { verify } = require("../utils/verify")

/*
// hre - HH runtime environments - davame jako parametr fce
async function deployFunc(hre) {
    console.log("zdarec vole")
    hre.getNamedAccounts
    hre.deployments
}
// budeme tuto fci exportovat jako defaultni pro HH deploy:
module.exports.default = deployFunc

//je to vesmes to same jako tohle:
*/

/*
module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = hre  // vytahneme jen nektere promenne z "hre" a toto by delalo to same:
    // hre.getNamedAccounts
    // hre.deployments
}

// a uplne to same dela i tohle:
*/

// misto toho pouzijeme "suger syntax"
// asynchronnous nameless fce, using arrow notation
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // poresim jestli mam priceFeed tahat z mocku nebo z configu..
    let ethUsdPriceFeedAddress
    // jsem na local nebo testnetu?
    if (developmentChains.includes(network.name)) {
        const lastEthUsdV3Agg = await get("MockV3Aggregator") // slo by i "deployments.get()", ziskava posledni deploy mocku (recently deployed)
        ethUsdPriceFeedAddress = lastEthUsdV3Agg.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] // ctu adresu z helper configu na zaklade chainid
    }

    // then deploy that shit.. a ulozi se jako "fundMe" - contract
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMeBitch", {
        from: deployer,
        args: args, // price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // we need to wait if on a live network so we can verify properly
    })
    //log(`FundMe deployed at ${fundMe.address}`)

    // VERIFY (kdyz nejsme na localu.. ale na testnetu) a zaroven je k dispozici API
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API
    ) {
        // vytvorime si "utils" folder (spolecne fce pro vice scriptu) - v minule lekci byl verify primo v deploy scriptu
        // vytvorime "verify" a importujeme

        await verify(fundMe.address, args)
    }

    log(
        "___________________________________________________________________________"
    )

    // NENI TO VSECHNO, NA GITHUB JSOU SOUBORY JINE.. ASI SE K TOMU DOSTANEM..
}

module.exports.tags = ["all", "fundme"] // diky tomuhle muzu deploynout jen fundme (zadam napr do konzole) a nebo "all" (vsude kde je all se deployne)
