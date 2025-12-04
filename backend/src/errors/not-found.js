import CustomAPIError from './custom-api.js';

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.errorCode = 'NOT_FOUND';
  }
}

export default NotFoundError;