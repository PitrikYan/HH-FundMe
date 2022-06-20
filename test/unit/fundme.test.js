const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai") // package of HH
const { developmentChains } = require("../../helper-hh-config")

// cele to pustim jen na local (development) chainu a ne na testnetu
// vyuziju k tomu podminku
// someVar = true
// whatToDo = someVar ? "Fuck" : "NotFuck"
// whatToDo = Fuck

// takze - kdyz NEJSEM na development chainu tak SKIP, kdyz jo tak pokracuju

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3
          // const sendValue = "1000000000000000000" // 1 eth
          // const sendValue = ethers.utils.parseEther("1") // prevede na WEI
          // const sendValue = ethers.utils.parseUnits("1", "ether") // taky to same
          const sendValue = ethers.utils.parseUnits("1", 18) // to same - prevede 1 na 18 desetinnych mist (BigNumber) =)

          beforeEach(async function () {
              // deploy contract using HH deploy
              await deployments.fixture(["all"]) // diky tomuhle deployneme fce ve slozce deploy! (protoze nakonci mame tag "all")

              // jak ziskat account:
              //const accounts = await ethers.getSigners() // vytahne cokoli co je v "accounts" u konkretniho networku (v configu), v pripade HH to bude 10 accountu co generuje
              //const accountZero = accounts[0]
              // a druhy zpusob (z HRE):
              // normalne by bylo: const { deployer } = await getNamedAccounts() // jaky account bude pripojen k FundMe contractu
              // ale chci to pouzivat i mimo takze nahore "let" a tady:
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMeBitch", deployer) // most recent fundme..
              // a kdykoli budeme volat FundMe, bude to z accountu "deployera"
              mockV3 = await ethers.getContract("MockV3Aggregator", deployer) // most recent mock..
          })

          // describe uvnitr describe - rozdelim testy na konretni sekce
          describe("constructor", async function () {
              it("Spravne nastaveni agregatoru", async function () {
                  const response = await fundMe.getPriceFeed() // vytahne promennou getPriceFeed
                  assert.equal(mockV3.address, response) // assert uz ma v sobe hromadu fci jako napr equal pro porovnani dvou hodnot zda se =
                  // expect(response).to.equal(mockV3.address)  -> tohle dela to same co assert nad tim..
              })
          })

          describe("fund", async function () {
              it("Send enough ETH?!", async function () {
                  // kdyz nic neposleme, tak ocekavame revert s konkretni chybou
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Tak to snad nemyslis vazne tyvole?! Minimalne 65!"
                  )
              })
              it("Update funded value", async function () {
                  await fundMe.fund({ value: sendValue }) // posleme 1 ETH jako msg.value
                  const response = await fundMe.getHowMuchTheyHave(deployer) // hodnota ulozena v mappingu (po zavolani funkce) u msg.sendera !!vraci BigNumber!!
                  // na string prevadim kvuli bignumber
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Update array of funders", async function () {
                  await fundMe.fund({ value: sendValue }) // posleme 1 ETH jako msg.value
                  const response = await fundMe.getFunder(0) // hodnota ulozena v poli (po zavolani funkce) na indexu 0
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", async function () {
              // pred kazdym testem withdraw, chceme aby prvni byl kontrakt zafundovan
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single funder", async function () {
                  // ARRANGING
                  // provider je funkce ethers (muzeme napsat i ethers.provider.getBalance)
                  const startBalanceOfContract =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startBalanceOfDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // ACTING
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait()
                  // na tomto radku (pod txReceipt) spustim debugger VS code a u txReceipt si najdu objekty gasUsed a effectiveGasPrice
                  // ty kdyz vynasobim tak mam celkovy gasCost
                  const { gasUsed, effectiveGasPrice } = txReceipt // vytahnu tyto objekty z objektu txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // oba jsou bigNumber, pouziju mul (multiple) k nasobeni..

                  console.log(gasCost.toString()) // pro zajimavost

                  const endBalanceOfContract = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endBalanceOfDeployer = await fundMe.provider.getBalance(
                      deployer
                  )

                  console.log(endBalanceOfDeployer.add(gasCost).toString()) // pro zajimavost

                  // ASSERTING
                  assert.equal(0, endBalanceOfContract)
                  // startBalanceOfContract je BigNumber, pro scitani pouzijeme ethers fci "add" BigNumber.add(otherValue)
                  // navic Withdraw stoji GAS!!! takze pripam "gasCost" (endBalanceOfDeployer je na konci uz bez GAS, takze ho musim pricist..)
                  // a pak oboje toString
                  assert.equal(
                      startBalanceOfDeployer.add(startBalanceOfContract),
                      endBalanceOfDeployer.add(gasCost).toString()
                  )
              })

              it("wanna withdraw with multiple funders, please allow me this", async function () {
                  // ARRANGING
                  // na zacatku se v "before" zavolal fund s deployerem (ten bude na indexu 0)
                  const accounts = await ethers.getSigners() // vytahnu vsechny HH accounts
                  // projdu treba 7 adres (zacinam od indexu 1, 0 je deployer)
                  console.log(deployer)
                  console.log(accounts[0].address)

                  for (i = 1; i < 8; i++) {
                      // potrebuju se na fundMe napojit pres jinou adresu nez deployer => pouziju connect
                      const fundMeFromOthers = await fundMe.connect(accounts[i])
                      await fundMeFromOthers.fund({ value: sendValue }) // a na tehle adrese zavolam fund
                  }
                  // pridam i veci z predchoziho testu
                  const startBalanceOfContract =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startBalanceOfDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // ACTING
                  const txResponse = await fundMe.withdraw() // stacilo by tady i jen tohle
                  // ale pridam i veci z predchoziho testu
                  const txReceipt = await txResponse.wait()
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endBalanceOfContract = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endBalanceOfDeployer = await fundMe.provider.getBalance(
                      deployer
                  )

                  // ASSERT

                  // z minula
                  assert.equal(0, endBalanceOfContract)
                  assert.equal(
                      startBalanceOfDeployer.add(startBalanceOfContract),
                      endBalanceOfDeployer.add(gasCost).toString()
                  )

                  // a nove check reseting of funders
                  await expect(fundMe.getFunder(0)).to.be.reverted // pole na indexu 0

                  // mapping
                  for (i = 1; i < 8; i++) {
                      const amountfunded = await fundMe.getHowMuchTheyHave(
                          accounts[i].address
                      )
                      assert.equal(amountfunded, 0)
                  }
              })

              it("Only fucking owner", async function () {
                  const accounts = await ethers.getSigners()
                  const notDeployer = accounts[19] // stranger! vytvorime account object a napojime se s nim na contract
                  console.log(accounts[5].address)
                  const connectContractToStranger = await fundMe.connect(
                      notDeployer
                  )

                  console.log(connectContractToStranger.signer.address)
                  console.log(connectContractToStranger.address)

                  const attack = connectContractToStranger.withdraw()

                  await expect(attack).to.be.revertedWith(
                      "FundMeBitch__NotOwner"
                  )
              })

              it("the best withdraw in the world (storage => memory..)", async function () {
                  // ARRANGING
                  // na zacatku se v "before" zavolal fund s deployerem (ten bude na indexu 0)
                  const accounts = await ethers.getSigners() // vytahnu vsechny HH accounts
                  // projdu treba 7 adres (zacinam od indexu 1, 0 je deployer)
                  console.log(deployer)
                  console.log(accounts[0].address)

                  for (i = 1; i < 8; i++) {
                      // potrebuju se na fundMe napojit pres jinou adresu nez deployer => pouziju connect
                      const fundMeFromOthers = await fundMe.connect(accounts[i])
                      await fundMeFromOthers.fund({ value: sendValue }) // a na tehle adrese zavolam fund
                  }
                  // pridam i veci z predchoziho testu
                  const startBalanceOfContract =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startBalanceOfDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // ACTING
                  const txResponse = await fundMe.theBestWithdraw() // stacilo by tady i jen tohle
                  // ale pridam i veci z predchoziho testu
                  const txReceipt = await txResponse.wait()
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endBalanceOfContract = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endBalanceOfDeployer = await fundMe.provider.getBalance(
                      deployer
                  )

                  // ASSERT

                  // z minula
                  assert.equal(0, endBalanceOfContract)
                  assert.equal(
                      startBalanceOfDeployer.add(startBalanceOfContract),
                      endBalanceOfDeployer.add(gasCost).toString()
                  )

                  // a nove check reseting of funders
                  await expect(fundMe.getFunder(0)).to.be.reverted // pole na indexu 0

                  // mapping
                  for (i = 1; i < 8; i++) {
                      const amountfunded = await fundMe.getHowMuchTheyHave(
                          accounts[i].address
                      )
                      assert.equal(amountfunded, 0)
                  }
              })
          })
      })
