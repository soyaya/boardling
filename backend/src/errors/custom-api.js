class CustomAPIError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 500;
    this.errorCode = 'INTERNAL_ERROR';
  }
}

export default CustomAPIError;