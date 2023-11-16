const rho_deploy = require('./rho_deploy.js');
const topUp = require('./server_rho.js');
const rho = require('./wallet.js');

/***用于单独简易测试rho的合约 */
const test = `
new x, y, z, stdout(\`rho:io:stdout\`),
  keccak256Hash(\`rho:crypto:keccak256Hash\`) in {
    keccak256Hash!("deadbeef".hexToBytes(), *y)
    |
    x!({
        "deadbeef".hexToBytes():"s"
    })
    |
    for(@xi <- x & @yi <- y) {
        stdout!((xi, yi))|
        @{*x | "11"}!("test")|
        @{"walletStore"}!("getAddr", "045fe473dfecbf8f2c9043ce85380423f860e551c701078879f76b0ab5519074e5f1eac8ea7ebf4d503b36733e388a1774b01b3a8f93d2010a9b66202b97c45ed7", *z)|
        for(@zi <- z){
            stdout!((({"1":1}).get(zi)))
        }|
        for(@ret <- @{*x | "11"}){
            stdout!(("ans", ret))
        }
    }
}
`

const _timestamp = new Date().valueOf();

//**** rho测试 */
// rho_deploy.func_deploy(test
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

//**** 向账户里转钱，便于部署 */ */
// rho_deploy.func_deploy(topUp.topUp("1111BqRy6Kq8u7mpPichorFKSQgYXmPW7iM2groTYeHog6zw6aMbo", 1000000000), 0, 1, "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9");
// rho_deploy.func_deploy(topUp.topUp("1111c8eqwiiKUVUYNb3eVVBatLgbT8FgMS9Wq12tGfEpQ98v4fjg6", 1000000000), 0, 1, "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9");

//**** 交易测试 */
// rho_deploy.func_deploy(rho.createWallet_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.checkBalance_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.transferFunds_rho("11112LNPSZa4qZg3jNpnD9aWWzfzj2PJPRtrryDdUsjvLc4uSsZ14X", 100000000, _timestamp)
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.checkTrans_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.SendMsg_rho("11112LNPSZa4qZg3jNpnD9aWWzfzj2PJPRtrryDdUsjvLc4uSsZ14X", "hello", _timestamp)
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.checkMsg_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

//**** NFT测试 上传、获取账户信息、发行、下架、获取市场信息 */
// rho_deploy.func_deploy(rho.createWallet_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.uploadNFT_rho("ajkhsdkasd", "test")
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.getMyNFT_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.releaseNFT_rho("d5f8c4d18c82b78b600adf46f9a495547e573e52c9c149270dd6373992c1acd8", 10000)
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.pullOffNFT_rho("d5f8c4d18c82b78b600adf46f9a495547e573e52c9c149270dd6373992c1acd8")
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.buyNFT_rho("1111BqRy6Kq8u7mpPichorFKSQgYXmPW7iM2groTYeHog6zw6aMbo","0ef9d8f8804d174666011a394cab7901679a8944d24249fd148a6a36071151f8",_timestamp)
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.getAllNFT_rho()
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

// rho_deploy.func_deploy(rho.getNFTPrice_rho("d5f8c4d18c82b78b600adf46f9a495547e573e52c9c149270dd6373992c1acd8")
//     , 0, 1, "60704947406a4ce5b2b0b5722440ea613801b33f1188d07242e5f4ff15b780b1");

/***另一方测试 */
// rho_deploy.func_deploy(rho.buyNFT_rho("1111BqRy6Kq8u7mpPichorFKSQgYXmPW7iM2groTYeHog6zw6aMbo","0ef9d8f8804d174666011a394cab7901679a8944d24249fd148a6a36071151f8","1042"), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.getNFTPrice_rho("0ef9d8f8804d174666011a394cab7901679a8944d24249fd148a6a36071151f8"), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.getNFTInfo_rho("0ef9d8f8804d174666011a394cab7901679a8944d24249fd148a6a36071151f8"), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.getMyNFT_rho(), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.getAllNFT_rho(), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.uploadNFT_rho("a","a"), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.releaseNFT_rho("0ef9d8f8804d174666011a394cab7901679a8944d24249fd148a6a36071151f8",200), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");

// rho_deploy.func_deploy(rho.createWallet_rho(), 0, 1,"d52bd144e23f71703a48264d71370449fee06a5f4a69a063d520c3aa76364e39");