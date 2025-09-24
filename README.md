# BNB Testnet Wallet Monitor

A Node.js script that monitors a BNB Testnet wallet for incoming USDT and BNB transactions, logging transaction details including hash, amount, sender, and timestamp.

## Features

- **Real-time Monitoring**: Continuously monitors new blocks for transactions
- **BNB Detection**: Detects incoming BNB transfers to your wallet
- **USDT Detection**: Monitors USDT token transfers using contract events
- **Detailed Logging**: Logs transaction hash, amount, sender, and timestamp
- **Auto-reconnection**: Automatically reconnects on connection errors
- **Efficient**: Uses event logs for USDT detection instead of scanning all transactions

## Prerequisites

- Node.js (v14 or higher)
- A BNB Testnet wallet address to monitor

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example configuration:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and update the following:
   - `walletAddress`: Your BNB Testnet wallet address to monitor
   - `rpcUrl`: BNB Testnet RPC endpoint (default should work)
   - `pollInterval`: How often to check for new blocks (in milliseconds)

## Usage

Start the monitor:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Example Output

```
Starting BNB Testnet Wallet Monitor...
Monitoring wallet: 0x1234...5678
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
USDT Contract: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
────────────────────────────────────────────────────────────
Starting from block: 12345678

BNB TRANSACTION DETECTED
────────────────────────────────────────
Transaction Hash: 0xabc123...
Amount: 0.1 BNB
From: 0xdef456...
To: 0x1234...5678
Timestamp: 2024-01-15T10:30:45.000Z
Block: 12345679
────────────────────────────────────────

USDT TRANSACTION DETECTED
────────────────────────────────────────
Transaction Hash: 0x789xyz...
Amount: 100.0 USDT
From: 0xghi789...
To: 0x1234...5678
Timestamp: 2024-01-15T10:35:20.000Z
Block: 12345680
────────────────────────────────────────
```

## Configuration Options

- `rpcUrl`: BNB Testnet RPC endpoint
- `walletAddress`: Wallet address to monitor
- `usdtContractAddress`: USDT contract address on BNB Testnet
- `blockConfirmations`: Number of block confirmations to wait (default: 1)
- `pollInterval`: Polling interval in milliseconds (default: 5000)

## BNB Testnet Information

- **Network**: BNB Smart Chain Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **USDT Contract**: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
- **Explorer**: https://testnet.bscscan.com/

## Error Handling

The script includes robust error handling:
- Automatic reconnection on network errors
- Graceful shutdown on SIGINT/SIGTERM
- Detailed error logging
- Continues monitoring even if individual transactions fail to process

## Stopping the Monitor

Press `Ctrl+C` to gracefully stop the monitor.

## Notes

- The script starts monitoring from the current block when launched
- USDT transfers are detected using contract event logs for efficiency
- BNB transfers are detected by checking transaction recipients
- All amounts are displayed in human-readable format (BNB and USDT)
- Timestamps are in ISO format (UTC)
