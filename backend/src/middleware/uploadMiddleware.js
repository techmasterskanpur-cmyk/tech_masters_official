const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `products-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Robust File Filter
const fileFilter = (req, file, cb) => {
    // 1. Check File Extension (Must be .csv)
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 2. Allow common CSV mime types (Windows/Excel often sends different ones)
    const allowedMimes = [
        'text/csv', 
        'application/vnd.ms-excel', 
        'application/octet-stream', 
        'text/plain',
        'text/x-csv',
        'application/csv'
    ];

    if (ext === '.csv' && allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // If mimetype is weird but extension is .csv, we allow it to be safe
        if (ext === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Please upload only CSV files.'), false);
        }
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter 
});

module.exports = upload;