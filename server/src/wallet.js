const getAddress_rho = () => `
new getAddress_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new retCh in{
        @{"walletStore"}!("getAddr", *deployerId, *retCh)|
        for(@ret <- retCh){
            match ret{
                deployerRevAddress =>{
                    getAddress_rhoReturn!((true,deployerRevAddress))|
                    stdout!(("deployerRevAddress",deployerRevAddress))
                }
                Nil => {
                    getAddress_rhoReturn!((false,"Cannot found Addr"))|
                    stdout!("Cannot found Addr")
                }
            }
        }
    }
}
`


const createWallet_rho = () => `
new createWallet_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`)  in{
    new walletAddrCh in{
        @{"walletStore"}!("getAddr", *deployerId, *walletAddrCh)|
        for(@walletAddr <- walletAddrCh){
            match walletAddr{
                ~Nil => {
                    stdout!("find addr")|
                    new nftwalletCh in{
                        @{"nftMarket"}!("createAccount", *deployerId, *nftwalletCh)|
                        for(@nftwallet <- nftwalletCh){
                            createWallet_rhoReturn!(nftwallet)
                        }
                    }
                }
                Nil => {
                    stdout!("Addr Wrong")|
                    createWallet_rhoReturn!((false,"Address Wrong!"))
                }
            }
        }
    }   
}

`

const checkBalance_rho = () => `
new checkBalance_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new walletCh in {
        @{"walletStore"}!("findOrCreate", *deployerId, *walletCh)|
        for(@(bool,wallet) <- walletCh){
            if(bool == true){
                new balanceCh in{
                    @wallet!("checkBalance",*deployerId, *balanceCh)|
                    for(@balance <- balanceCh){
                        checkBalance_rhoReturn!(balance)|
                        stdout!(("balance ", balance))
                    }
                }
            }
            else{
                checkBalance_rhoReturn!((false,"Cannot find amount"))|
                stdout!("Cannot Check")
            }
        }
    }
}

`

const transferFunds_rho = (to, amount, timeStamp) => `
new transferFunds_rhoReturn, stdout(\`rho:io:stdout\`),deployerId(\`rho:rchain:deployerId\`) in{
    new walletCh in {
        @{"walletStore"}!("findOrCreate", *deployerId, *walletCh)|
        for(@(bool,wallet) <- walletCh){
            if(bool == true){
                new transferCh in{
                    @wallet!("transfer",*deployerId, "${to}", ${amount}, "${timeStamp}", *transferCh)|
                    for(@transfer <- transferCh){
                        transferFunds_rhoReturn!(transfer)
                    }
                }
            }
            else{
                transferFunds_rhoReturn!((false,"Cannot find amount"))
            }
        }
    }
}
`

const checkTrans_rho = () => `
new checkTrans_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new walletCh in {
        @{"walletStore"}!("findOrCreate", *deployerId, *walletCh)|
        for(@(bool,wallet) <- walletCh){
            if(bool == true){
                new checkTransCh in{
                    @wallet!("checkTrans", *deployerId, *checkTransCh)|
                    for(@checkTrans <- checkTransCh){
                        checkTrans_rhoReturn!(checkTrans)|
                        stdout!(checkTrans)
                    }
                }
            }
            else{
                checkTrans_rhoReturn!((false,"Cannot find amount"))
            }
        }
    }
}
`

const SendMsg_rho = (to, msg, timeStamp) => `
new SendMsg_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new walletCh in {
        @{"walletStore"}!("findOrCreate", *deployerId, *walletCh)|
        for(@(bool,wallet) <- walletCh){
            if(bool == true){
                new sendMsgCh in{
                    @wallet!("sendMessage", *deployerId, "${to}", "${msg}", "${timeStamp}", *sendMsgCh)|
                    for(@sendMsg <- sendMsgCh){
                        SendMsg_rhoReturn!((true,"send Message"))
                    }
                }
            }
            else{
                SendMsg_rhoReturn!((false,"Cannot find amount"))
            }
        }
    }
}
`

const checkMsg_rho = () => `
new checkMsg_rhoReturn, stdout(\`rho:io:stdout\`),deployerId(\`rho:rchain:deployerId\`) in{
    new walletCh in {
        @{"walletStore"}!("findOrCreate", *deployerId, *walletCh)|
        for(@(bool,wallet) <- walletCh){
            if(bool == true){
                new checkMsgCh in{
                    @wallet!("checkMessage", *deployerId, *checkMsgCh)|
                    for(@checkMsg <- checkMsgCh){
                        checkMsg_rhoReturn!(checkMsg)|
                       stdout!(checkMsg)
                    }
                }
            }
            else{
                checkMsg_rhoReturn!((false,"Cannot find amount"))
            }
        }
    }
}
`

const uploadNFT_rho = (term,info) => `
new uploadNFT_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new uploadCH in{
        @{"nftMarket"}!("upload",*deployerId, "${term}", "${info}", *uploadCH) |
        for(@upload <- uploadCH){
            uploadNFT_rhoReturn!(upload)
        }
    }
            
}
`

const releaseNFT_rho = (id,price) => `
new releaseNFT_rhoReturn, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
    new releaseCH in{
        @{"nftMarket"}!("release", *deployerId, "${id}".hexToBytes(), ${price}, *releaseCH) |
        for(@release <- releaseCH){
            releaseNFT_rhoReturn!(release)
        }
    }         
}
`


const pullOffNFT_rho = (id) => `
new pullOffNFT_rhoReturn, stdout(\`rho:io:stdout\`),deployerId(\`rho:rchain:deployerId\`) in{
    new pulloffCh in{
        @{"nftMarket"}!("pulloff", *deployerId,  "${id}".hexToBytes(), *pulloffCh) |
        for(@pulloff <- pulloffCh){
            pullOffNFT_rhoReturn!(pulloff)
        }            
    }
}
`


const buyNFT_rho = (from, id, timeStamp) => `
new buyNFT_rhoReturn, stdout(\`rho:io:stdout\`),deployerId(\`rho:rchain:deployerId\`) in{
    new buyCH in{
        stdout!(("hexToBytes()","${id}".hexToBytes()))|
        @{"nftMarket"}!("buy", *deployerId, "${from}", "${id}".hexToBytes(), "${timeStamp}", *buyCH) |
        for(@buy <- buyCH){
            buyNFT_rhoReturn!(buy)|
            stdout!(buy)
        }
    }
}
`

const getMyNFT_rho = () => `
new getMyNFT_rhoReturn, stdout(\`rho:io:stdout\`),deployerId(\`rho:rchain:deployerId\`) in{
    new getMyNFTCh in{
        @{"nftMarket"}!("getAllNFTinAccount", *deployerId,  *getMyNFTCh) |
        for(@getMyNFT <- getMyNFTCh){
            getMyNFT_rhoReturn!(getMyNFT)|
            stdout!(getMyNFT)
        }
    }
}
`

const getAllNFT_rho = () => `
new getAllNFT_rhoReturn, stdout(\`rho:io:stdout\`) in{
    new getAllNFTCh in{
        @{"nftMarket"}!("getAllNFTinMarket", *getAllNFTCh) |
        for(@getAllNFT <- getAllNFTCh){
            getAllNFT_rhoReturn!(getAllNFT)|
            stdout!(getAllNFT)
        }
    }   
}
`


const getNFTPrice_rho = (id) => `
new getNFTPrice_rhoReturn, stdout(\`rho:io:stdout\`) in{
    new getNFTPriceCh in{
        @{"nftMarket"}!("getNFTPrice", "${id}".hexToBytes(), *getNFTPriceCh) |
        for(@getNFTPrice <- getNFTPriceCh){
            getNFTPrice_rhoReturn!(getNFTPrice)|
            stdout!(getNFTPrice)
        }
    }      
}
`


const getNFTInfo_rho = (id) => `
new getNFTInfo_rhoReturn, stdout(\`rho:io:stdout\`) in{  
    new getNFTInfoCh in{
        @{"nftMarket"}!("getNFTInfo", "${id}".hexToBytes(), *getNFTInfoCh) |
        for(@getNFTInfo <- getNFTInfoCh){
            getNFTInfo_rhoReturn!(getNFTInfo)|
            stdout!(getNFTInfo)
        }
    }       
}
`

const checkMarketTrans_rho = (id) => `
new checkMarketTrans_rhoReturn, stdout(\`rho:io:stdout\`) in{  
    new getTransCh in{
        @{"transaction"}!("check", *getTransCh) |
        for(@getTrans <- getTransCh){
            checkMarketTrans_rhoReturn!(getTrans)|
            stdout!(getTrans)
        }
    }       
}
`

module.exports = {
	getAddress_rho,
    createWallet_rho,
    checkBalance_rho,
    transferFunds_rho,
    checkTrans_rho,
    SendMsg_rho,
    checkMsg_rho,
    uploadNFT_rho,
    releaseNFT_rho,
    pullOffNFT_rho,
    buyNFT_rho,
    getAllNFT_rho,
    getMyNFT_rho,
    getNFTInfo_rho,
    getNFTPrice_rho,
    checkMarketTrans_rho
};
