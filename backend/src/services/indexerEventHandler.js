/**
 * Indexer Event Handler
 * 
 * This module connects the blockchain indexer events to the wallet tracking service.
 * It listens for new blocks and transactions from the indexer and triggers
 * appropriate wallet sync operations.
 */

import { handleNewBlock, handleNewTransaction } from './walletTrackingService.js';

let eventListeners = [];
let isListening = false;

/**
 * Start listening to indexer events
 * 
 * @param {EventEmitter} blockchainEvents - Event emitter from the indexer
 * @param {Object} options - Configuration options
 */
function startIndexerEventListener(blockchainEvents, options = {}) {
  if (isListening) {
    console.log('Indexer event listener already running');
    return;
  }
  
  const {
    enableBlockEvents = true,
    enableTransactionEvents = false, // Disabled by default for performance
    blockEventThrottle = 0 // Milliseconds to throttle block events
  } = options;
  
  console.log('Starting indexer event listener...');
  console.log(`  - Block events: ${enableBlockEvents ? 'enabled' : 'disabled'}`);
  console.log(`  - Transaction events: ${enableTransactionEvents ? 'enabled' : 'disabled'}`);
  
  // Block processed event handler
  if (enableBlockEvents) {
    let lastBlockProcessedTime = 0;
    
    const blockHandler = async (blockData) => {
      try {
        // Throttle block events if configured
        const now = Date.now();
        if (blockEventThrottle > 0 && (now - lastBlockProcessedTime) < blockEventThrottle) {
          console.log(`Throttling block event for block ${blockData.height}`);
          return;
        }
        
        lastBlockProcessedTime = now;
        
        console.log(`[Event] Block processed: ${blockData.height}`);
        await handleNewBlock(blockData.height, blockData);
      } catch (error) {
        console.error(`Error handling block event:`, error.message);
      }
    };
    
    blockchainEvents.on('blockProcessed', blockHandler);
    eventListeners.push({ event: 'blockProcessed', handler: blockHandler });
    console.log('✓ Subscribed to blockProcessed events');
  }
  
  // Transaction event handler
  if (enableTransactionEvents) {
    const txHandler = async (txData) => {
      try {
        console.log(`[Event] Transaction detected: ${txData.txid}`);
        await handleNewTransaction(txData);
      } catch (error) {
        console.error(`Error handling transaction event:`, error.message);
      }
    };
    
    blockchainEvents.on('transactionProcessed', txHandler);
    eventListeners.push({ event: 'transactionProcessed', handler: txHandler });
    console.log('✓ Subscribed to transactionProcessed events');
  }
  
  isListening = true;
  console.log('Indexer event listener started successfully');
}

/**
 * Stop listening to indexer events
 * 
 * @param {EventEmitter} blockchainEvents - Event emitter from the indexer
 */
function stopIndexerEventListener(blockchainEvents) {
  if (!isListening) {
    console.log('Indexer event listener not running');
    return;
  }
  
  console.log('Stopping indexer event listener...');
  
  // Remove all event listeners
  for (const { event, handler } of eventListeners) {
    blockchainEvents.removeListener(event, handler);
    console.log(`✓ Unsubscribed from ${event} events`);
  }
  
  eventListeners = [];
  isListening = false;
  
  console.log('Indexer event listener stopped');
}

/**
 * Get listener status
 */
function getListenerStatus() {
  return {
    isListening,
    activeListeners: eventListeners.map(l => l.event)
  };
}

export {
  startIndexerEventListener,
  stopIndexerEventListener,
  getListenerStatus
};
