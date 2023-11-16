const express = require('express');
const app = express();
app.use(express.json());
const rho_deploy = require('rho_deploy.js');
const server_rho = require('server_rho.js');
const rho = require('wallet.js');
let priKey = "6b2c9887ce24094087896a0fa3c64e3faec8ad06f16fbe72da3a44463aeca8a9";

// 监听的ip
var host = "10.0.16.13";

// 监听的端口
var port = 40410;

// 监听端口 
app.listen(port, host, () => { console.log('服务器已启动，监听ip： ' + host + ' ，端口：' + port); });

// 接收到充值请求
// 接收到的json文件希望是这样的：
// address: 1209801924
// amount: 111111
// timestampSt
app.post('/ischarge', async (req, res) => {
  console.log("after login");
  console.log(req.body);
  let address = req.body.address;
  let amount = req.body.amount;
  let resData = await rho_deploy.func_deploy(server_rho.topUp(address,amount),0,1,priKey);
  console.log(resData);
  res.send(resData);
  // 在这里进行充值的部署
  // res.json({
  //   "amount": req.body.amount,
  //   "address": req.body.address,
  //   "type": "isrechargeAns"
  // }
  // );
})
