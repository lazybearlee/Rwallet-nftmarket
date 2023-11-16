const rho_deploy = require('./rho_deploy.js');
const server_rho = require('./server_rho.js');
const rho = require('./wallet.js');
let priKey = "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9";

rho_deploy.func_deploy(server_rho.init(), 0, 1, priKey);