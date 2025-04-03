// Environment configuration
const ENV = {
  development: {
    API_URL: 'http://localhost:3000',
  },
  production: {
    API_URL: 'https://discord-summarizer-api.onrender.com', // Update with your actual production API URL
  }
};

// Set the current environment
const CURRENT_ENV = 'development'; // Change to 'production' for production builds

// Export the configuration for the current environment
const CONFIG = ENV[CURRENT_ENV];
