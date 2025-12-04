import CustomAPIError from './custom-api.js';

class PrivacyRestrictedError extends CustomAPIError {
  constructor(message = 'Data access restricted by privacy settings') {
    super(message);
    this.statusCode = 403;
    this.errorCode = 'PRIVACY_RESTRICTED';
  }
}

export default PrivacyRestrictedError;
