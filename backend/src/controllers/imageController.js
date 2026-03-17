const axios = require('axios');

exports.fetchImage = async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('URL is required');

        // Clean URL
        const cleanUrl = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;

        const response = await axios({
            method: 'GET',
            url: cleanUrl,
            responseType: 'stream',
            headers: {
                // Fake headers taaki unhe lage real user hai
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://sunelectronics.co.in/' 
            }
        });

        // Forward the image type (jpg/png)
        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);

    } catch (error) {
        console.error("Proxy Error:", error.message);
        // Fallback image redirect
        res.redirect('https://placehold.co/600x600?text=No+Image');
    }
};