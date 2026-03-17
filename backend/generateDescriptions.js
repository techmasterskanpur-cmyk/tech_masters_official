/**
 * ============================================================
 * Tech_Masters — AI Product Description Generator (Groq Edition)
 * ============================================================
 * This script reads all your products from MongoDB, finds ones
 * with missing/weak descriptions, calls Groq AI to generate a
 * rich description + specifications for each, then saves them
 * back to MongoDB.
 *
 * HOW TO RUN:
 *   1. Get a FREE Groq API key from: https://console.groq.com
 *      (Sign up → API Keys → Create API Key)
 *   2. Run: node generateDescriptions.js --key=YOUR_GROQ_KEY
 *
 *   Optional flags:
 *     --dry-run        Preview what would be updated, without saving
 *     --limit=10       Only process first N products (good for testing)
 *     --category=BMS   Only process a specific category
 * ============================================================
 */

const mongoose = require('mongoose');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const ProductModel = require('./src/models/productModel.js');
const Product = ProductModel.default || ProductModel;

// ── Parse CLI arguments ──────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace('--', '').split('=');
    return [k, v === undefined ? true : v];
  })
);

const GROQ_API_KEY = args.key || "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" || process.env.GROQ_API_KEY;
const DRY_RUN      = !!args['dry-run'];
const LIMIT        = args.limit ? parseInt(args.limit) : null;
const ONLY_CATEGORY = args.category || null;

if (!GROQ_API_KEY) {
  console.error('\n❌ ERROR: No Groq API key provided!');
  console.error('   Get a FREE key at https://console.groq.com');
  console.error('   Then run: node generateDescriptions.js --key=YOUR_KEY\n');
  process.exit(1);
}

// ── Groq API caller (OpenAI-compatible) ─────────────────────
const callGroq = (prompt) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a product data specialist for an electronics store. Always respond with valid raw JSON only — no markdown, no code fences, no extra text.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'Groq API error'));
            return;
          }
          const text = parsed?.choices?.[0]?.message?.content;
          if (text) resolve(text.trim());
          else reject(new Error('No content in response: ' + data));
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ── Build prompt for a product ───────────────────────────────
const buildPrompt = (name, category) => `
You are a product data specialist for an electronics e-commerce store called Tech_Masters.
Write a realistic product listing for this component. The store RESELLS electronic components sourced from manufacturers.

Product Name: ${name}
Category: ${category}

Respond with a JSON object with exactly two fields:
1. "description": 3-4 factual sentences about what this product is, how it works, and who uses it (students, engineers, makers, hobbyists). No marketing fluff.
2. "specifications": An object with 5-8 key-value pairs of technical specs. Keys should be specific properties like "Operating Voltage", "Current Rating", "Material", "Compatibility", "Dimensions", "Package Includes". Derive specs from the product name where possible.

Return ONLY raw JSON, no markdown, no code fences. Example:
{"description":"The TP4056 is a ...","specifications":{"Operating Voltage":"5V","Charging Current":"1A","Protection":"Overcharge & overdischarge","Compatibility":"Single cell Li-ion/LiPo","Package Includes":"1 x TP4056 Module"}}
`;

// ── Check if description is weak/missing ────────────────────
const isWeakDescription = (desc) => {
  if (!desc) return true;
  const d = desc.trim();
  if (d === '' || d === 'N/A' || d === 'Quality component by Tech_Masters.') return true;
  if (d.length < 60) return true;
  return false;
};

// ── Check if specifications are missing/empty ─────────────────
const isWeakSpecs = (specs) => {
  if (!specs) return true;
  // Handle MongoDB Map object
  if (typeof specs === 'object' && !(specs instanceof Map)) {
    return Object.keys(specs).length === 0;
  }
  if (specs instanceof Map) return specs.size === 0;
  if (typeof specs === 'string') {
    const s = specs.trim();
    return s === '' || s === 'N/A';
  }
  return true;
};

// ── Sleep utility (to avoid rate limits) ────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────
const run = async () => {
  console.log('\n🚀 Tech_Masters — AI Description Generator');
  console.log('===========================================');
  if (DRY_RUN) console.log('⚠️  DRY RUN mode — nothing will be saved to MongoDB');
  console.log('');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('🟢 MongoDB connected\n');

  // Find products that need descriptions
  const query = {};
  if (ONLY_CATEGORY) query.category = new RegExp(ONLY_CATEGORY, 'i');

  let products = await Product.find(query).select('_id productId name category description specifications');
  console.log(`📊 Found ${products.length} total products in database.`);

  // Filter to only those with weak descriptions OR missing specs
  const beforeCount = products.length;
  products = products.filter(p => isWeakDescription(p.description) || isWeakSpecs(p.specifications));
  console.log(`🔍 After filtering, ${products.length} products need enrichment.`);

  if (LIMIT) products = products.slice(0, LIMIT);

  console.log(`📦 Found ${products.length} products needing descriptions\n`);

  if (products.length === 0) {
    console.log('✅ All products already have descriptions! Nothing to do.');
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const num = `[${i + 1}/${products.length}]`;

    process.stdout.write(`${num} Generating for: "${product.name.slice(0, 60)}"... `);

    try {
      const prompt = buildPrompt(product.name, product.category);
      const response = await callGroq(prompt);

      // Clean up any accidental markdown code fences
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.description || !parsed.specifications) {
        throw new Error('Missing fields in AI response');
      }

      // Convert specifications (object) to a proper Map-compatible plain object
      // If Gemini returns a string, parse key: value lines into object
      let specsObj = {};
      if (typeof parsed.specifications === 'string') {
        parsed.specifications.split('\n').forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            const val = line.slice(colonIdx + 1).trim();
            if (key && val) specsObj[key] = val;
          }
        });
      } else if (typeof parsed.specifications === 'object') {
        specsObj = parsed.specifications;
      }

      if (!DRY_RUN) {
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              description: parsed.description,
              specifications: specsObj
            }
          }
        );
      }

      console.log('✅ Done');
      successCount++;

      // 30s delay — extremely conservative to bypass tight TPM/RPM limits
      if (i < products.length - 1) await sleep(30000);

    } catch (err) {
      console.log(`❌ Failed: ${err.message.slice(0, 80)}`);
      failCount++;

      // Longer delay after an error (likely rate limit)
      await sleep(30000);
    }
  }

  console.log('\n===========================================');
  console.log(`✅ Success: ${successCount} products updated`);
  console.log(`❌ Failed:  ${failCount} products skipped`);
  if (DRY_RUN) console.log('\n⚠️  DRY RUN — no changes were saved. Remove --dry-run to save.');
  console.log('');

  process.exit(0);
};

run().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
