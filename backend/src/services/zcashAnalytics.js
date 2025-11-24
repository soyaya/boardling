import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
import { MongoClient } from 'mongodb';

class ZcashAnalytics {
  constructor() {
    this.rpcUrl = `http://${process.env.ZCASH_RPC_HOST}:${process.env.ZCASH_RPC_PORT}`;
    this.rpcAuth = {
      username: process.env.ZCASH_RPC_USER,
      password: process.env.ZCASH_RPC_PASSWORD
    };
    this.mongoUri = process.env.MONGO_URI;
    this.dbName = process.env.MONGO_DB;
  }

  async rpcCall(method, params = []) {
    try {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      }, { auth: this.rpcAuth });
      
      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }
      
      return response.data.result;
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('RPC Response Error:', error.response.data);
      }
      throw error;
    }
  }

  async getWalletTransactions(address, count = 100) {
    try {
      // Test connection with getblockchaininfo (newer method)
      const info = await this.rpcCall('getblockchaininfo');
      console.log('Connected to Zcash node, blocks:', info.blocks);
      
      // For now, return empty array since we need address indexing
      console.log('Note: Address indexing may not be enabled. Returning mock data.');
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      return [];
    }
  }

  calculateTxValue(tx, address) {
    let value = 0;
    
    // Calculate value from outputs
    if (tx.vout) {
      tx.vout.forEach(output => {
        if (output.scriptPubKey && output.scriptPubKey.addresses && 
            output.scriptPubKey.addresses.includes(address)) {
          value += output.value || 0;
        }
      });
    }
    
    return value;
  }

  async analyzeWalletData(address) {
    const transactions = await this.getWalletTransactions(address);
    
    const analysis = {
      address,
      transactions: transactions.map(tx => ({
        txid: tx.txid,
        timestamp: tx.time || tx.blocktime,
        type: 'transfer',
        value: this.calculateTxValue(tx, address),
        confirmations: tx.confirmations || 0
      })),
      summary: {
        totalTransactions: transactions.length,
        totalValue: 0,
        avgValue: 0,
        frequency: {}
      }
    };

    analysis.summary.totalValue = analysis.transactions.reduce((sum, tx) => sum + tx.value, 0);
    analysis.summary.avgValue = analysis.summary.totalValue / analysis.summary.totalTransactions || 0;
    
    const frequencies = this.calculateFrequencies(analysis.transactions);
    analysis.summary.frequency = frequencies;
    analysis.recurringPatterns = this.detectRecurringPatterns(analysis.transactions);

    return analysis;
  }

  calculateFrequencies(transactions) {
    const daily = {};
    const weekly = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp * 1000);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);
      
      daily[dayKey] = (daily[dayKey] || 0) + 1;
      weekly[weekKey] = (weekly[weekKey] || 0) + 1;
    });

    return { daily, weekly };
  }

  detectRecurringPatterns(transactions) {
    const patterns = [];
    const sortedTx = transactions.sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedTx.length - 1; i++) {
      const intervals = [];
      for (let j = i + 1; j < sortedTx.length; j++) {
        const daysDiff = Math.floor((sortedTx[j].timestamp - sortedTx[i].timestamp) / 86400);
        if (daysDiff % 7 === 0 && daysDiff <= 84) {
          intervals.push(daysDiff);
        }
      }
      
      if (intervals.length >= 3) {
        patterns.push({
          type: 'weekly',
          frequency: 7,
          occurrences: intervals.length + 1,
          avgValue: sortedTx[i].value
        });
      }
    }

    return patterns;
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }

  async saveAnalysis(analysis) {
    const client = new MongoClient(this.mongoUri);
    try {
      await client.connect();
      const db = client.db(this.dbName);
      const collection = db.collection('wallet_analytics');
      
      await collection.replaceOne(
        { address: analysis.address },
        { ...analysis, updatedAt: new Date() },
        { upsert: true }
      );
    } finally {
      await client.close();
    }
  }
}

export default ZcashAnalytics;