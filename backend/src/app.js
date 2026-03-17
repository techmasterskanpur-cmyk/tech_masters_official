const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes'); // Import Routes


const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use('/api/orders', orderRoutes);

// Logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Tech_Masters Backend is working!' });
});

module.exports = app;