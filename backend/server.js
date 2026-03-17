const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/database/db'); // <--- IMPORT HERE

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to Database first
        await connectDB(); // <--- RUN HERE
        
        // Then start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error);
    }
};

startServer();