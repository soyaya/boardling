import CustomAPIError from './custom-api.js';

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = 403;
    this.errorCode = 'PERMISSION_DENIED';
  }
}

export default ForbiddenError;
