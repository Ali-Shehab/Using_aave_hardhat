const {getWeth,amount} = require("../scripts/getWeth")
const {getNamedAccounts, ethers} = require("hardhat")
async function main()
{
    await getWeth()
    const { deployer } = await getNamedAccounts()
    AMOUNT = ethers.utils.parseEther("0.02")

    //depositing in aave
    // we need abi and address
    const lendingPool = await getLendingPool(deployer)
    // console.log(`Lending Pool Address ${LendingPool.address}`)

    // since the aave protocol is using our money we need to approve her contract to use our money
    const wethTokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    await approveERC20(wethTokenAddress,lendingPool.address,amount,deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress,AMOUNT,deployer,0)
    console.log("Desposited!")

    //Borrowing
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
    const daiPrice = await getDAIPrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
    const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDai(daiAddress,lendingPool,amountDaiToBorrowWei,deployer)
    await getBorrowUserData(lendingPool, deployer)

    //repay the borrow
    await repay(amountDaiToBorrowWei,daiAddress,lendingPool,deployer)
    await getBorrowUserData(lendingPool, deployer)
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveERC20(daiAddress, lendingPool.address, amount, account)
    const tx = await lendingPool.repay(daiAddress, amount, 1, account)
    await tx.wait(1)
    console.log("Repaid the borrow!")
}


async function borrowDai(daiAddress, lendingPool, amountDaiToBorrow, account) {
    const tx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account)
    await tx.wait(1)
    console.log("You've borrowed DAI!")
}


async function getDAIPrice()
{
    const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface","0x773616E4d11A78F511299002da57A0a94577F1f4") // no need for deployer since we will only be reading
    const price = (await daiEthPriceFeed.latestRoundData())[1] //since we all need the answer at the first index
    console.log(`Price of DAI/ETH ${price.toString()}`)
    return price
}

async function approveERC20(erc20Address, spenderAddress, amountToSpend, account)
{
    const erc20Token = await ethers.getContractAt("IERC20",erc20Address,account)
    const tx = await erc20Token.approve(spenderAddress,amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

async function getLendingPool(account)
{
    const lendingPoolAddressProvider  = await ethers.getContractAt("ILendingPoolAddressesProvider","0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",account)
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
    const LendingPool = await ethers.getContractAt("ILendingPool",lendingPoolAddress,account)
    return LendingPool
}

async function getBorrowUserData(lendingPool,account)
{
    const { totalCollateralETH,totalDebtETH,availableBorrowsETH} = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of Eth deposited.`)
    console.log(`You have ${totalDebtETH} worth of Eth borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of Eth.`)
    return {availableBorrowsETH,totalDebtETH}
}
main()
    .then(()=>process.exit(0))
    .catch((error)=>{
        console.error(error)
        process.exit(1)
    })