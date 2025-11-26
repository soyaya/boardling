import { CustomAPIError } from '../errors/index.js';

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

export { errorHandlerMiddleware };