const Product = require('../models/productModel');
const fs = require('fs');
const csv = require('csv-parser');

exports.uploadProducts = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    console.log("🚀 Starting Error-Free Upload...");
    const products = [];
    const cleanKey = (key) => key.trim().replace(/^\ufeff/, '');

    let rowIndex = 0;

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (rawRow) => {
            rowIndex++;
            try {
                const row = {};
                Object.keys(rawRow).forEach(key => row[cleanKey(key)] = rawRow[key]);

                const name = row['wd-entities-title'] || row['name'] || `Product ${rowIndex}`;
                
                let basePrice = parseFloat(row['woocommerce-Price-amount'] || row['basePrice']);
                if (isNaN(basePrice)) basePrice = 0;

                // ✅ PRICING STRATEGY (Tiered Margins + Psychological Pricing)
                let finalPrice = basePrice;
                if (basePrice > 0) {
                    if (basePrice < 100) {
                        finalPrice = basePrice * 1.05; // 5% margin
                    } else if (basePrice >= 100 && basePrice <= 200) {
                        finalPrice = basePrice * 1.07; // 7% margin
                    } else {
                        finalPrice = basePrice * 1.10; // 10% margin
                    }

                    finalPrice = Math.round(finalPrice);

                    if (finalPrice % 10 === 0) {
                        finalPrice -= 1;
                    }
                }

                let images = [];
                if (row['images']) images = row['images'].split(',');
                else if (row['image']) images.push(row['image']);
                else images.push("https://placehold.co/600x600?text=No+Image");

                products.push({
                    productId: `SKU-${Date.now()}-${rowIndex}`, 
                    name: name.trim(),
                    category: row['category'] || 'Components',
                    description: row['description'] || name,
                    basePrice: basePrice,
                    finalPrice: finalPrice,
                    stock: parseInt(row['stock'] || 50),
                    image: images[0],
                    images: images
                });
            } catch (err) { console.log("Skipping row"); }
        })
        .on('end', async () => {
            try {
                await Product.deleteMany({});
                await Product.insertMany(products);
                console.log(`✅ SUCCESS! ${products.length} Products Uploaded.`);
                fs.unlinkSync(req.file.path);
                res.status(200).json({ message: 'Upload Successful!' });
            } catch (error) {
                console.error("❌ ERROR:", error.message);
                res.status(500).json({ message: error.message });
            }
        });
};

exports.getProducts = async (req, res) => { try { res.json(await Product.find()); } catch(e) { res.status(500).json(e); } };
exports.deleteProduct = async (req, res) => { try { await Product.deleteOne({ _id: req.params.id }); res.json({ message: 'Deleted' }); } catch(e) { res.status(500).json(e); } };
exports.deleteAllProducts = async (req, res) => { try { await Product.deleteMany({}); res.json({ message: 'All Deleted' }); } catch(e) { res.status(500).json(e); } };

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment: comment,
                user: req.user._id,
            };

            product.reviews.push(review);

            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error("Review Error:", error);
        res.status(500).json({ message: error.message });
    }
};