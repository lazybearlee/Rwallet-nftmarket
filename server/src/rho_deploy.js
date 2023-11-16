const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const rchainToolkit = require('@fabcotech/rchain-toolkit');
const rchainToolkit_grpc = require('@fabcotech/rchain-toolkit/dist/grpc.js');
const fs = require('fs');
const path = require('path');

const READ_ONLY_HOST = 'http://192.168.231.129:40403';
const VALIDATOR_HOST = 'http://192.168.231.129:40403';
const GRPC_HOST = "192.168.231.129:40402";
const SHARD_ID = 'root';
const WAITING_TIME = 5000;
const numOfTrying = 4;
const tryingTime = 2000;

const func_deploy = async (rho_code_, order_, depth_, privateKey) => {

  const PRIVATE_KEY = privateKey;
  const PUBLIC_KEY = rchainToolkit.utils.publicKeyFromPrivateKey(PRIVATE_KEY);

  const _timestamp = new Date().valueOf();

  const grpcClient = await rchainToolkit_grpc.getGrpcProposeClient(
    GRPC_HOST,
    grpc,
    protoLoader
  );
  
  let pd;

  if(order_ >= 0){
    pd = await rchainToolkit.http.prepareDeploy(
      READ_ONLY_HOST,
      {
        deployer: PUBLIC_KEY,
        timestamp: _timestamp,
        nameQty: order_ + 1
      }
    );

    console.log('Prepare deploy...');
    console.log(pd + '\n');
  };

  const _validAfterBlockNumber = await rchainToolkit.http.validAfterBlockNumber(
    READ_ONLY_HOST
  );

  const deployOptions = rchainToolkit.utils.getDeployOptions(
    {
      timestamp: _timestamp,
      term: rho_code_,
      shardId: SHARD_ID,
      privateKey: PRIVATE_KEY,
      phloPrice: 1,
      phloLimit: 100000000,
      validAfterBlockNumber: _validAfterBlockNumber || -1
    }
  );

  let deployResponse;
  try {
    deployResponse = await rchainToolkit.http.deploy(
      VALIDATOR_HOST,
      deployOptions
    );
  } catch (err) {
    console.log(err);
  };

  console.log('deployResponse:');
  console.log(deployResponse + '\n');
  
  let proposeResponse;
  try {
    proposeResponse = await rchainToolkit_grpc.propose({}, grpcClient);
  } catch (err) {
    console.log(err);
  };

  await new Promise(resolve => setTimeout(resolve, WAITING_TIME));

  console.log('Propose Success!\n');

  let ret;
  
  let cnt = 0;

  if(order_ >= 0){
    while (cnt++ < numOfTrying) {
      const dataAtUnforgeableName = await rchainToolkit.http.dataAtName(
        READ_ONLY_HOST,
        {
          name: {
            UnforgPrivate: { data: JSON.parse(pd).names[order_] }
          },
          depth: depth_
        }
      );
      
      // console.log('data-at-name response:');
      // console.log(dataAtUnforgeableName + '\n');
      
      const data_json = JSON.parse(dataAtUnforgeableName).exprs[0];

      console.log('data_json:');
      console.log(data_json + '\n');
      
      let data;

      if(data_json != null){
        data = rchainToolkit.utils.rhoValToJs(
          data_json.expr
        );
      } else {
        data = null;
      }
      
      console.log('data:');
      console.log(data  + '\n');

      ret = data;
      if (ret != null) {
        console.log('Deploy Finished!\n');  
        return ret;
      }
      else {
        console.log('Trying to get response again.\n'); 
        await new Promise(resolve => setTimeout(resolve, tryingTime));
      }
    }
    ret = "Get valid response failed.";
    console.log('Get valid response failed.');
  } else {
    ret = null;
    console.log('Simple Deploy Finished!\n');
  }

  return ret;
};

const func_deploy_fromfile = async (rho_file_, order_, depth_, privateKey) => {
  const rho_code = fs.readFileSync(path.join(__dirname, rho_file_), 'utf8');
  return func_deploy(rho_code, order_, depth_, privateKey);
};

module.exports = {
	func_deploy,
  func_deploy_fromfile
};


