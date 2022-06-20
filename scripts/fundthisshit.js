const { deployments, ethers, getNamedAccounts, network } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    fundMe = await ethers.getContract("FundMeBitch", deployer)
    console.log("Jde se na to..")
    const txResponse = await await fundMe.fund({
        value: ethers.utils.parseEther("0.06"),
    })
    await txResponse.wait()
    console.log("A je to..")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
