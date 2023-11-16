
const topUp = (revAddr, amount) => `
new
  ret,
  rl(\`rho:registry:lookup\`), RevVaultCh,
  stdout(\`rho:io:stdout\`)
in {

  rl!(\`rho:rchain:revVault\`, *RevVaultCh) |
  for (@(_, RevVault) <- RevVaultCh) {

    stdout!(("3.transfer_funds.rho")) |

    // REPLACE THE REV ADDRESSES HERE vvv
    match (
      "11112gNSU4Ytt3b2TpAQnggARSidPpNxrNkWqFFg52aNe5t6sjCy2c",
      "${revAddr}",
      ${amount}
    ) {
      (from, to, amount) => {

        new vaultCh, targetVaultCh, revVaultkeyCh, deployerId(\`rho:rchain:deployerId\`) in {
          @RevVault!("findOrCreate", from, *vaultCh) |
          // make sure the target vault it created and the transfer would be done
          @RevVault!("findOrCreate", to, *targetVaultCh) |
          @RevVault!("deployerAuthKey", *deployerId, *revVaultkeyCh) |
          for (@(true, vault) <- vaultCh & key <- revVaultkeyCh & @(true, _) <- targetVaultCh) {

            stdout!(("Beginning transfer of ", amount, "REV from", from, "to", to)) |

            new resultCh in {
              @vault!("transfer", to, amount, *key, *resultCh) |
              for (@result <- resultCh) {
                ret!(result)|
                stdout!(("Finished transfer of ", amount, "REV to", to, "result was:", result))
              }
            }
          }
        }
      }
    }
  }

}
`

const init = () => `
new initRet, stdout(\`rho:io:stdout\`), deployerId(\`rho:rchain:deployerId\`) in{
  new initWalletCh, initTransCh, initNftCh in {
      @{"walletStore"}!("init", *deployerId,  *initWalletCh)|
      @{"transaction"}!("init", *deployerId, *initTransCh)|
      @{"nftMarket"}!("init", *deployerId, *initNftCh)|
      for(@wr <- initWalletCh & @tr <- initTransCh & @nr <- initNftCh) {
          initRet!((wr, tr, nr))|
          stdout!((wr, tr, nr))
      }
  }
}
`

module.exports = {
  topUp,
  init
}