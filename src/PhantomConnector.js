import React, { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl, Transaction, TransactionInstruction } from '@solana/web3.js';
import { serialize } from 'borsh';
import { Buffer } from 'buffer';
import bs58 from 'bs58';

window.Buffer = Buffer;

const PROGRAM_ID = new PublicKey('6QnLoMCJV2quAy4GuEsDzH7ubN5vW9NN9zwVNgXNEhYo');

class UserMetadata {
  constructor({ user_solana, did_public_address }) {
      this.user_solana = user_solana;
      this.did_public_address = did_public_address;
  }
}

const UserMetadataSchema = new Map([
  [UserMetadata, {
      kind: 'struct',
      fields: [
          ['user_solana', 'string'],
          ['did_public_address', 'string'],
      ],
  }],
]);

function PhantomConnector() {
  const [walletAddress, setWalletAddress] = useState(null);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana && solana.isPhantom) {
        console.log('Phantom wallet found!');
        
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      } else {
        alert('Phantom wallet not found! Please install it.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendTransaction = async () => {
    if (!window.solana.isConnected) {
      await connectWallet();
    }

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const userMetadata = new UserMetadata({
      user_solana: 'ExampleSolanaAddress',
      did_public_address: 'Pedro infante',
    });
    const userMetadataBuffer = Buffer.from(serialize(UserMetadataSchema, userMetadata));
    
    const customInstruction = new TransactionInstruction({
      keys: [],
      programId: PROGRAM_ID,
      data: userMetadataBuffer,
    });
    
    const transaction = new Transaction().add(customInstruction);
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.feePayer = window.solana.publicKey;
    
    console.log('Sending transaction...');
    const { signature } = await window.solana.signAndSendTransaction(transaction);
    console.log('Transaction signature:', signature);

    await connection.confirmTransaction(signature);
    console.log('Transaction confirmed');
  };

  // Automatically check if the Phantom wallet is connected when the component mounts
  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div>
      {!walletAddress && (
        <button onClick={connectWallet}>Connect to Phantom Wallet</button>
      )}
      {walletAddress && (
        <button onClick={sendTransaction}>Send Transaction</button>
      )}
    </div>
  );
}

export default PhantomConnector;
