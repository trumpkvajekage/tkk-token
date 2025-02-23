const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SystemProgram,
} = require('@solana/web3.js');
const {
  createMint,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  MintLayout,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createSetDefaultAccountStateInstruction,
  createEnableCpiGuardInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  mintTo,
  transfer,
  setAuthority,
  AuthorityType,
  AccountState,
  getAssociatedTokenAddress,
} = require('@solana/spl-token');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3, createSignerFromKeypair, mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

const loadWallet = (filename) => {
  try {
    const secretKey = JSON.parse(fs.readFileSync(filename, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error) {
    throw new Error(`Failed to load wallet from ${filename}: ${error.message}`);
  }
};

async function createAdvancedToken() {
  const payer = loadWallet('wallet.json');
  console.log('Primary Wallet Public Key:', payer.publicKey.toBase58());

  const secondWallet = Keypair.generate();
  fs.writeFileSync('second-wallet.json', JSON.stringify(Array.from(secondWallet.secretKey)));
  console.log('Second Wallet Public Key:', secondWallet.publicKey.toBase58());

  try {
    const mint = Keypair.generate();
    const mintAuthority = payer.publicKey;
    const decimals = 9;
    const totalSupply = 1_000_000_000 * (10 ** decimals);
    const rent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

    const transaction = new Transaction();
    transaction.add(
      createInitializeMintCloseAuthorityInstruction(mint.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID)
    );
    transaction.add(
      createInitializeTransferFeeConfigInstruction(
        mint.publicKey,
        payer.publicKey,
        payer.publicKey,
        0, // Initial 0% transfer fee
        BigInt(0),
        TOKEN_2022_PROGRAM_ID
      )
    );
    transaction.add(
      createInitializeMetadataPointerInstruction(
        mint.publicKey,
        payer.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );
    transaction.add(
      createInitializeMintInstruction(mint.publicKey, decimals, mintAuthority, null, TOKEN_2022_PROGRAM_ID)
    );
    transaction.add(
      createSetDefaultAccountStateInstruction(mint.publicKey, AccountState.Initialized, TOKEN_2022_PROGRAM_ID)
    );
    transaction.add(
      createEnableCpiGuardInstruction(mint.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID)
    );
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: rent,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    );

    await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
    console.log('Mint Created! Mint Address:', mint.publicKey.toBase58());

    // Mint all tokens to primary ATA
    const primaryATA = await createATA(payer, mint.publicKey);
    await mintTo(
      connection,
      payer,
      mint.publicKey,
      primaryATA,
      payer.publicKey,
      totalSupply,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log(`Minted ${totalSupply / (10 ** decimals)} TKK to Primary ATA: ${primaryATA.toBase58()}`);

    // Revoke mint authority
    await setAuthority(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      AuthorityType.MintTokens,
      null,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('Mint authority revoked');

    // Set metadata with socials
    await addMetadata(payer, mint.publicKey);

    // Create ATA for second wallet
    const secondATA = await createATA(secondWallet, mint.publicKey);
    console.log('Second Wallet ATA:', secondATA.toBase58());

    // Transfer 200M to second wallet (0% fee)
    const transferAmount1 = 200_000_000 * (10 ** decimals);
    await transfer(
      connection,
      payer,
      primaryATA,
      secondATA,
      payer.publicKey,
      transferAmount1,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log(`Transferred 200M TKK to Second Wallet ATA: ${secondATA.toBase58()}`);

    // Vesting setup: Transfer 600M to vesting vault
    const vestingAmount = 600_000_000 * (10 ** decimals);
    const vestingVault = Keypair.generate();
    const vestingVaultATA = await createATA(vestingVault, mint.publicKey);
    await transfer(
      connection,
      payer,
      primaryATA,
      vestingVaultATA,
      payer.publicKey,
      vestingAmount,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    console.log(`Transferred 600M TKK to Vesting Vault ATA: ${vestingVaultATA.toBase58()}`);

    // Initialize vesting with delayed start
    const vestingProgramId = new PublicKey('YourProgramIDHere');
    const vestingAccount = Keypair.generate();
    const periods = 1095;
    const initVestingIx = new TransactionInstruction({
      programId: vestingProgramId,
      keys: [
        { pubkey: vestingAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
        { pubkey: mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: vestingVaultATA, isSigner: false, isWritable: true },
        { pubkey: primaryATA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([0, ...Buffer.from(vestingAmount.toString()), ...Buffer.from(periods.toString())]),
    });
    await sendAndConfirmTransaction(connection, new Transaction().add(initVestingIx), [payer, vestingAccount]);
    console.log('Vesting vault initialized for 600M TKK, awaiting start trigger. Vault ATA:', vestingVaultATA.toBase58());

    // Remaining 200M stays in primary ATA
    console.log('Remaining 200M TKK (unlocked) in Primary ATA:', primaryATA.toBase58());

    return { mint: mint.publicKey, payer, primaryATA, secondATA, vestingVaultATA, vestingAccount };
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

async function createATA(owner, mint) {
  const ata = await getAssociatedTokenAddress(mint, owner.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      owner.publicKey,
      ata,
      owner.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );
  await sendAndConfirmTransaction(connection, transaction, [owner]);
  return ata;
}

async function addMetadata(payer, mint) {
  const umi = createUmi('https://api.mainnet-beta.solana.com');
  const keypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(mplTokenMetadata());

  const metadata = {
    mint: mint,
    name: 'TrumpKvajeKage',
    symbol: 'TKK',
    uri: 'https://raw.githubusercontent.com/trumpkvajekage/tkk-token/main/metadata/tkk-metadata.json',
  };

  await createMetadataAccountV3(umi, {
    mint: metadata.mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer.publicKey,
    data: {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
  }).sendAndConfirm(umi);

  console.log('Metadata Added! Token Name:', metadata.name);
}

async function main() {
  try {
    const tokenData = await createAdvancedToken();
    if (!tokenData) return;

    const { mint, payer, primaryATA, secondATA, vestingVaultATA, vestingAccount } = tokenData;

    console.log('\nToken creation complete. Copy these values for startProject.js:');
    console.log('MINT_ADDRESS:', mint.toBase58());
    console.log('Primary ATA (200M unlocked, vesting destination):', primaryATA.toBase58());
    console.log('Second Wallet ATA (200M TKK):', secondATA.toBase58());
    console.log('Vesting Vault ATA (600M locked):', vestingVaultATA.toBase58());
    console.log('Vesting Account:', vestingAccount.publicKey.toBase58());
    console.log('Vesting Program ID: YourProgramIDHere');
    console.log('Note: Run startProject.js to set transfer fee and begin vesting');
  } catch (error) {
    console.error('Main execution failed:', error);
  }
}

main();
