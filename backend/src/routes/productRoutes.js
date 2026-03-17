const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// ✅ Import Controllers (Make sure names match)
const { 
    getProducts, 
    uploadProducts, 
    deleteProduct, 
    deleteAllProducts,
    createProductReview
} = require('../controllers/productController');

const { fetchImage } = require('../controllers/imageController');
const { protect } = require('../middleware/authMiddleware');

// --- Routes ---

// 1. Get All Products
router.get('/', getProducts);

// 2. Upload CSV
router.post('/upload', upload.single('file'), uploadProducts);

// 3. ✅ DELETE ALL PRODUCTS (Is route par hit karne se sab delete ho jayega)
router.delete('/delete-all', deleteAllProducts);

// 4. ✅ DELETE SINGLE PRODUCT (One by one fix)
router.delete('/:id', deleteProduct);

// 5. Add Review
router.post('/:id/reviews', protect, createProductReview);

// 6. Image Proxy
router.get('/proxy/image', fetchImage);

module.exports = router;