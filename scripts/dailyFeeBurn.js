const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { withdrawWithheldTokensFromMint, burn, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

exports.handler = async (event) => {
  try {
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY)));
    const mintAddress = process.env.MINT_ADDRESS;
    const primaryATA = new PublicKey(process.env.PRIMARY_ATA);

    // Get balance before withdrawal
    const balanceBefore = await connection.getTokenAccountBalance(primaryATA);
    const beforeAmount = balanceBefore.value.uiAmount * (10 ** 9);

    // Withdraw transfer fees
    await withdrawWithheldTokensFromMint(
      connection,
      payer,
      new PublicKey(mintAddress),
      primaryATA,
      payer.publicKey,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Get balance after withdrawal
    const balanceAfter = await connection.getTokenAccountBalance(primaryATA);
    const afterAmount = balanceAfter.value.uiAmount * (10 ** 9);

    // Burn only the withdrawn fees
    const amountToBurn = afterAmount - beforeAmount;
    if (amountToBurn > 0) {
      await burn(
        connection,
        payer,
        primaryATA,
        new PublicKey(mintAddress),
        payer.publicKey,
        amountToBurn,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      console.log(`Burned ${amountToBurn / (10 ** 9)} TKK (transfer fees)`);
    } else {
      console.log('No transfer fees to burn');
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Fees withdrawn and burned' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
