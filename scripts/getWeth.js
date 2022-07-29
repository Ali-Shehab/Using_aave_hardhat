const {getNamedAccounts,ethers} = require("hardhat")

const amount = ethers.utils.parseEther("0.02")
async function getWeth()
{
    const { deployer } = await getNamedAccounts()
    // call the deposit function on the weth.
    // we call it by using ABI and the contract address
    // the abi we added an interface for it
    // the contract address is: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

    const iWeth = await ethers.getContractAt("IWeth","0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",deployer)
    const tx = await iWeth.deposit({value: amount})
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Got ${wethBalance.toString()} WETH`)

}

module.exports = {getWeth,amount}