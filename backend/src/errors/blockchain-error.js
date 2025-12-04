import CustomAPIError from './custom-api.js';

class BlockchainError extends CustomAPIError {
  constructor(message = 'Blockchain interaction failed') {
    super(message);
    this.statusCode = 503;
    this.errorCode = 'BLOCKCHAIN_ERROR';
  }
}

export default BlockchainError;
