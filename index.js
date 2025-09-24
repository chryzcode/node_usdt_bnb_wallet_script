const { ethers } = require('ethers');
const config = require('./config');

// USDT ABI for transfer events
const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

class WalletMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.usdtContract = new ethers.Contract(
      config.usdtContractAddress,
      USDT_ABI,
      this.provider
    );
    this.lastProcessedBlock = null;
    this.isRunning = false;
  }

  async start() {
    console.log('Starting BNB Testnet Wallet Monitor...');
    console.log(`Monitoring wallet: ${config.walletAddress}`);
    console.log(`RPC URL: ${config.rpcUrl}`);
    console.log(`USDT Contract: ${config.usdtContractAddress}`);
    console.log('─'.repeat(60));

    try {
      // Get current block number
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      console.log(`Starting from block: ${this.lastProcessedBlock}`);

      this.isRunning = true;
      await this.monitorBlocks();
    } catch (error) {
      console.error('Failed to start monitor:', error.message);
      await this.handleError(error);
    }
  }

  async monitorBlocks() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          console.log(`Checking blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);
          
          for (let blockNum = this.lastProcessedBlock + 1; blockNum <= currentBlock; blockNum++) {
            await this.processBlock(blockNum);
          }
          
          this.lastProcessedBlock = currentBlock;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, config.pollInterval));
      } catch (error) {
        console.error('Error in monitoring loop:', error.message);
        await this.handleError(error);
      }
    }
  }

  async processBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      
      if (!block || !block.transactions) {
        return;
      }

      // Process each transaction in the block
      for (const tx of block.transactions) {
        await this.processTransaction(tx, block);
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber}:`, error.message);
    }
  }

  async processTransaction(tx, block) {
    try {
      // Check if transaction is to our monitored wallet
      if (tx.to && tx.to.toLowerCase() === config.walletAddress.toLowerCase()) {
        // This is a BNB transfer to our wallet
        if (tx.value && tx.value > 0) {
          await this.logBNBTransaction(tx, block);
        }
      }

      // Check for USDT transfers using event logs
      if (tx.to && tx.to.toLowerCase() === config.usdtContractAddress.toLowerCase()) {
        const receipt = await this.provider.getTransactionReceipt(tx.hash);
        if (receipt && receipt.logs) {
          await this.processUSDTLogs(receipt.logs, tx, block);
        }
      }
    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error.message);
    }
  }

  async processUSDTLogs(logs, tx, block) {
    for (const log of logs) {
      try {
        // Decode the Transfer event
        const decodedLog = this.usdtContract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (decodedLog && decodedLog.name === 'Transfer') {
          const { from, to, value } = decodedLog.args;
          
          // Check if transfer is to our monitored wallet
          if (to.toLowerCase() === config.walletAddress.toLowerCase()) {
            await this.logUSDTTransaction({
              hash: tx.hash,
              from: from,
              to: to,
              value: value,
              blockNumber: block.number,
              timestamp: block.timestamp
            });
          }
        }
      } catch (error) {
        // Skip logs that can't be decoded (not Transfer events)
        continue;
      }
    }
  }

  async logBNBTransaction(tx, block) {
    const amount = ethers.formatEther(tx.value);
    const timestamp = new Date(block.timestamp * 1000).toISOString();
    
    console.log('\nBNB TRANSACTION DETECTED');
    console.log('─'.repeat(40));
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log(`Amount: ${amount} BNB`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Block: ${block.number}`);
    console.log('─'.repeat(40));
  }

  async logUSDTTransaction(txData) {
    const amount = ethers.formatUnits(txData.value, 6); // USDT has 6 decimals
    
    console.log('\nUSDT TRANSACTION DETECTED');
    console.log('─'.repeat(40));
    console.log(`Transaction Hash: ${txData.hash}`);
    console.log(`Amount: ${amount} USDT`);
    console.log(`From: ${txData.from}`);
    console.log(`To: ${txData.to}`);
    console.log(`Timestamp: ${new Date(txData.timestamp * 1000).toISOString()}`);
    console.log(`Block: ${txData.blockNumber}`);
    console.log('─'.repeat(40));
  }

  async handleError(error) {
    console.error('Error occurred:', error.message);
    console.log('Attempting to reconnect in 10 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (this.isRunning) {
      try {
        // Test connection
        await this.provider.getBlockNumber();
        console.log('Connection restored, resuming monitoring...');
      } catch (reconnectError) {
        console.error('Reconnection failed:', reconnectError.message);
        await this.handleError(reconnectError);
      }
    }
  }

  stop() {
    console.log('\nStopping wallet monitor...');
    this.isRunning = false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.monitor) {
    global.monitor.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (global.monitor) {
    global.monitor.stop();
  }
  process.exit(0);
});

// Start the monitor
async function main() {
  const monitor = new WalletMonitor();
  global.monitor = monitor;
  
  try {
    await monitor.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Check if config file exists
try {
  require('./config');
} catch (error) {
  console.error('Configuration file not found!');
  console.log('Please copy config.example.js to config.js and update the settings.');
  console.log('   - Set your wallet address');
  console.log('   - Adjust RPC URL if needed');
  process.exit(1);
}

main().catch(console.error);
