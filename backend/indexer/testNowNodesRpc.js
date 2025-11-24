import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * A simple function to test the NowNodes Zcash RPC endpoint.
 */
async function testRpc() {
  console.log('--- Starting NowNodes RPC Test ---');

  const rpcUrl = process.env.ZEC_RPC_URL;

  if (!rpcUrl) {
    console.error('Error: ZEC_RPC_URL is not defined in your .env file.');
    console.log('Please ensure your .env file contains a line like: ZEC_RPC_URL="https://zec.nownodes.io/YOUR_API_KEY"');
    return;
  }

  console.log(`Attempting to connect to RPC endpoint: ${rpcUrl}`);

  try {
    const response = await axios.post(rpcUrl, {
      jsonrpc: '1.0',
      id: 'test',
      method: 'getbestblockhash',
      params: [],
    }, {
      // Adding a timeout to prevent the script from hanging indefinitely
      timeout: 10000 // 10 seconds
    });

    console.log('\n✅ --- RPC Call Successful! ---');
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ --- RPC Call Failed! ---');
    console.error('An error occurred while trying to contact the RPC endpoint:');
    console.error(error.message);
  }
}

testRpc();