import CustomAPIError from './custom-api.js';

class InsufficientBalanceError extends CustomAPIError {
  constructor(message = 'Insufficient balance for this operation') {
    super(message);
    this.statusCode = 400;
    this.errorCode = 'INSUFFICIENT_BALANCE';
  }
}

export default InsufficientBalanceError;
