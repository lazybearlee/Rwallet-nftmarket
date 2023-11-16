const rho_deploy = require('./rho_deploy.js');
const topUp = require('./server_rho.js');//测试用
const WAITING_TIME = 10000;

const privateKey = '6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9'

const deploy = async () => {

    rho_deploy.func_deploy_fromfile('./wallet.rho', -1, 1, privateKey);

    await new Promise(resolve => setTimeout(resolve, WAITING_TIME));
    
    rho_deploy.func_deploy_fromfile('./NFTMarket.rho', -1, 1, privateKey);
    
    await new Promise(resolve => setTimeout(resolve, WAITING_TIME));
    
    rho_deploy.func_deploy_fromfile('./transaction.rho', -1, 1, privateKey);
    
    await new Promise(resolve => setTimeout(resolve, WAITING_TIME));
    
    //**** 向账户里转钱，便于部署 */ */
    rho_deploy.func_deploy(topUp.topUp("1111BqRy6Kq8u7mpPichorFKSQgYXmPW7iM2groTYeHog6zw6aMbo", 1000000000), 0, 1, "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9");
    rho_deploy.func_deploy(topUp.topUp("1111c8eqwiiKUVUYNb3eVVBatLgbT8FgMS9Wq12tGfEpQ98v4fjg6", 1000000000), 0, 1, "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9");
    
}

deploy();
