/**
 * Configuration fetcher utility
 * Fetches SDK configuration from the server
 */

import axios from 'axios';

/**
 * Fetch SDK configuration from server
 */
export async function fetchServerConfig(baseURL) {
  try {
    const response = await axios.get(`${baseURL}/api/config`, {
      timeout: 5000
    });
    return response.data.sdk;
  } catch (error) {
    // Return null if config fetch fails
    return null;
  }
}

/**
 * Create SDK instance with server-fetched configuration
 */
export async function createWithServerConfig(baseURL, overrides = {}) {
  const serverConfig = await fetchServerConfig(baseURL);
  
  if (serverConfig) {
    return {
      baseURL: serverConfig.baseURL,
      timeout: serverConfig.timeout,
      apiVersion: serverConfig.apiVersion,
      ...overrides
    };
  }
  
  // Fallback to provided baseURL
  return {
    baseURL,
    timeout: 30000,
    ...overrides
  };
}