import CustomAPIError from './custom-api.js';

class SubscriptionExpiredError extends CustomAPIError {
  constructor(message = 'Your subscription has expired') {
    super(message);
    this.statusCode = 402;
    this.errorCode = 'SUBSCRIPTION_EXPIRED';
  }
}

export default SubscriptionExpiredError;
