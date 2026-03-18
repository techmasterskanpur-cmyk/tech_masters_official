# Tech_Masters — IoT Components Store

Tech_Masters is a comprehensive e-commerce platform for electronic components, featuring a full-stack architecture with a React frontend and a Node.js/Express/MongoDB backend.

## Project Structure

- **Frontend**: Built with Vite, React, TypeScript, and Tailwind CSS.
- **Backend**: Node.js, Express, and MongoDB Atlas for cloud-based data storage.
- **AI Enrichment**: Integrated with Groq AI for professional product descriptions and specifications.
 
## Key Features

- **Extensive Catalog**: Over 1,480 products across multiple categories.
- **Cloud-Powered**: Fully migrated to MongoDB Atlas.
- **Professional UI**: shadcn/ui components with a custom branding system.
- **Interactive Discovery**: Personalized product recommendations, search, and filtering.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd tech-masters-ui-main
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Setup Environment Variables:
   Create a `.env` file in the backend root and add:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_cluster_uri
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```sh
   npm start
   ```

## License

This project is for private use by Tech_Masters.
