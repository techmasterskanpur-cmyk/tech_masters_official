const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true, 
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        index: true 
    },
    // ✅ NEW: Added to store full category path (e.g., ["Arduino", "Sensors"])
    subCategories: [{
        type: String
    }],
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    finalPrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    specifications: {
        type: Map,
        of: String,
        default: {} 
    },
    images: [{
        type: String 
    }],
    rating: {
        type: Number,
        default: 0
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);