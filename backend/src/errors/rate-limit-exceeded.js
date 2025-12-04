import CustomAPIError from './custom-api.js';

class RateLimitExceededError extends CustomAPIError {
  constructor(message = 'Too many requests, please try again later') {
    super(message);
    this.statusCode = 429;
    this.errorCode = 'RATE_LIMIT_EXCEEDED';
  }
}

export default RateLimitExceededError;
