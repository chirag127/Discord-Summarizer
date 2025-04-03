// Environment configuration
var ENV = {
    development: {
        API_URL: "http://localhost:3000", // Local development server
    },
    production: {
        API_URL: "https://discord-summarizer.onrender.com", // Production API URL
    },
};

// Set the current environment
var CURRENT_ENV = "production"; 
// var CURRENT_ENV = "development"; // Change to 'production' for production builds
//

// Export the configuration for the current environment
var CONFIG = ENV[CURRENT_ENV];

// Log the configuration for debugging
console.log("Discord Summarizer API URL:", CONFIG.API_URL);
