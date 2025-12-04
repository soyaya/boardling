import CustomAPIError from './custom-api.js';

class PaymentRequiredError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = 402;
    this.errorCode = 'PAYMENT_REQUIRED';
  }
}

export default PaymentRequiredError;
