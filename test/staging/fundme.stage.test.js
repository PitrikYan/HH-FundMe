// velmi podobne unit testu (tam je vse okomentovane a vysvetlene)
// zadny mock, a zadny fixtures (deploy)

const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { networkConfig, developmentChains } = require("../../helper-hh-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.06")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMeBitch", deployer)
          })

          it("Everyone can fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endBalanceOfContract = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endBalanceOfContract.toString(), "0")
          })
      })
