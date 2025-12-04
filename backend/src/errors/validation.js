import CustomAPIError from './custom-api.js';

class ValidationError extends CustomAPIError {
  constructor(message, details = null) {
    super(message);
    this.statusCode = 400;
    this.errorCode = 'VALIDATION_ERROR';
    this.details = details;
  }
}

export default ValidationError;
