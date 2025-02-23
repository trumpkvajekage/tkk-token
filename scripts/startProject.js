const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { setTransferFee, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

async function startProject() {
  const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('wallet.json', 'utf8'))));
  const mintAddress = '<MINT_ADDRESS>'; // Replace with MINT_ADDRESS from createSolanaToken.js output
  const vestingProgramId = new PublicKey('YourProgramIDHere'); // Replace with deployed vesting program ID
  const vestingAccount = new PublicKey('<VESTING_ACCOUNT>'); // Replace with Vesting Account from createSolanaToken.js output

  const transaction = new Transaction();

  // Set transfer fee to 1%
  transaction.add(
    setTransferFee(
      connection,
      payer,
      new PublicKey(mintAddress),
      100, // 1% transfer fee (100 basis points)
      BigInt(5_000_000_000), // Max fee 5 TKK
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    )
  );

  // Start vesting
  const startVestingIx = new TransactionInstruction({
    programId: vestingProgramId,
    keys: [
      { pubkey: vestingAccount, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: new PublicKey(mintAddress), isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // start_vesting instruction ID
  });
  transaction.add(startVestingIx);

  await sendAndConfirmTransaction(connection, transaction, [payer]);
  console.log('Project launched! Transfer fee set to 1% and vesting started.');
}

startProject().catch(console.error);
