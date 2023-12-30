import * as solanaWeb3 from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// const PROGRAM_ID = new solanaWeb3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa")
// const PROGRAM_DATA_PUBLIC_KEY = new solanaWeb3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod")

// async function pingProgram(connection: solanaWeb3.Connection, payer: solanaWeb3.Keypair) {
//     const transaction = new solanaWeb3.Transaction()
//     const instruction = new solanaWeb3.TransactionInstruction({
//       // Instructions need 3 things 
      
//       // 1. The public keys of all the accounts the instruction will read/write
//       keys: [
//         {
//           pubkey: PROGRAM_DATA_PUBLIC_KEY,
//           isSigner: false,
//           isWritable: true
//         }
//       ],
      
//       // 2. The ID of the program this instruction will be sent to
//       programId: PROGRAM_ID
      
//       // 3. Data - in this case, there's none!
//     })
  
//     transaction.add(instruction)
//     const transactionSignature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [payer])
  
//     console.log(
//       `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
//       )
//   }


async function airDropSOL(connection: solanaWeb3.Connection, signer: solanaWeb3.Keypair){
    const balance= await connection.getBalance(signer.publicKey);

    console.log("Your balance is: ", balance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");

    if (balance < 1) {
        console.log("Airdropping 1 SOL");
        const signature= await connection.requestAirdrop(signer.publicKey, solanaWeb3.LAMPORTS_PER_SOL);

        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: signature,
          });
        console.log("Airdrop successful");
        const newBalance= await connection.getBalance(signer.publicKey);
    // const newBalance=balance+1;
    console.log("Your new balance is: ", newBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
    }

}

async function initializeKeyPair(connection: solanaWeb3.Connection): Promise<solanaWeb3.Keypair>{
    if (!process.env.PRIVATE_KEY) {
        console.log('Generating new keypair... 🗝️');
        const signer= solanaWeb3.Keypair.generate();

        console.log("creating a .env file to store the above generated keypair");
        fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`);
        await airDropSOL(connection, signer);
        return signer;

    }

    //generating a second keypair 
    // const signer= solanaWeb3.Keypair.generate();
    // console.log("second keypair generated: ", signer.publicKey.toString());

    const secret= JSON.parse(process.env.PRIVATE_KEY) as number[];
    const secretKey= Uint8Array.from(secret);
    const keyPair= solanaWeb3.Keypair.fromSecretKey(secretKey);
    await airDropSOL(connection, keyPair);
    return keyPair;

    

}

async function sendSOL(connection: solanaWeb3.Connection, signer: solanaWeb3.Keypair, receiver: solanaWeb3.PublicKey, AmountOfSOLToSend : number){
    const sender = signer.publicKey;
    const senderBalance= await connection.getBalance(sender);
    const receiverBalance= await connection.getBalance(receiver);
    console.log("Sender balance: ", senderBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
    console.log("Receiver balance: ", receiverBalance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");

    var transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: receiver,
            lamports: solanaWeb3.LAMPORTS_PER_SOL * AmountOfSOLToSend,
        }),
    );

    const signature= await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [signer]);

    //print the transaction signature
    console.log('SIGNATURE: ', signature);
    //print balances
    const senderBalanceAfter= await connection.getBalance(sender);
    const receiverBalanceAfter= await connection.getBalance(receiver);
    console.log("Sender balance: ", senderBalanceAfter / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
    console.log("Receiver balance: ", receiverBalanceAfter / solanaWeb3.LAMPORTS_PER_SOL, "SOL");


}

async function main() {
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"));
    const signer = await initializeKeyPair(connection);

    console.log("Your public key is: ", signer.publicKey.toBase58());
    // await pingProgram(connection, signer);
    const receiver= new solanaWeb3.PublicKey('7Fid5aEwjL242RNqLRRP77zgHE69cgeXAbYocJvthqZV');
    await sendSOL(connection, signer, receiver, 0.1);
}

main()
    .then(() => {
        // throw new Error("Not implemented")
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
