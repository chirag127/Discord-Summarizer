const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
