const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    updateUserProfile,
    googleLogin,
    forgotPassword, // ✅ Imported new function
    resetPassword   // ✅ Imported new function
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin); 

// ✅ NEW: Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private Route (Login required)
router.route('/profile').put(protect, updateUserProfile);

module.exports = router;