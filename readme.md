# 🚀 Smart Deals Server

The Smart Deals Server is the backend API for the Smart Deals marketplace application. It handles product management, bidding functionality, authentication verification, and secure access to user-specific resources using Firebase Authentication and MongoDB.

---

# 🌐 Live API

```text
https://smart-deals-server-sooty.vercel.app/
```

---

# 📖 Project Overview

This backend provides RESTful APIs for:

- Product Management
- Product Search
- Product Bidding
- User-Specific Product Access
- User-Specific Bid Access
- Firebase Token Verification
- MongoDB Data Storage

The server is built using Express.js and deployed on Vercel.

---

# 🛠️ Technologies Used

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Firebase Admin SDK
- dotenv
- CORS

## Deployment

- Vercel

---

# 🔐 Authentication & Authorization

The server uses Firebase Authentication and Firebase Admin SDK to verify Firebase ID Tokens.

### Protected Routes

The following routes require authentication:

```http
GET /products?email=user@example.com
GET /bids?email=user@example.com
```

### Token Verification Middleware

```javascript
const verifyToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({
      message: "Unauthorized access",
    });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    const userInfo = await admin.auth().verifyIdToken(token);

    req.user = userInfo;

    next();
  } catch {
    return res.status(403).send({
      message: "Forbidden access",
    });
  }
};
```

### User Ownership Validation

The server ensures users can only access their own resources.

Example:

```javascript
if (req.user.email !== email) {
  return res.status(403).send({
    message: "Forbidden",
  });
}
```

---

# 🗄️ Database

## Database Name

```text
smartDealsDB
```

## Collections

### Products Collection

Stores:

- Product Information
- Seller Information
- Product Status
- Pricing Information

### Bids Collection

Stores:

- Bid Information
- Buyer Information
- Product Reference
- Bid Amount

---

# 📡 API Endpoints

---

## Root Route

### Check Server Status

```http
GET /
```

### Response

```json
{
  "message": "Server is live"
}
```

---

# 📦 Products API

---

## Get All Products

### Endpoint

```http
GET /products
```

### Description

Returns all products available in the marketplace.

---

## Get Products by Seller

### Endpoint

```http
GET /products?email=user@example.com
```

### Headers

```http
Authorization: Bearer <firebase_id_token>
```

### Description

Returns products belonging to the authenticated seller.

---

## Get Latest Products

### Endpoint

```http
GET /latest-products
```

### Description

Returns the 6 most recently added products.

---

## Search Products

### Endpoint

```http
GET /products/search?q=laptop
```

### Description

Searches products by:

- Title
- Category
- Location
- Condition

---

## Get Product Details

### Endpoint

```http
GET /products/:productId
```

### Description

Returns a single product by ID.

---

## Create Product

### Endpoint

```http
POST /products
```

### Description

Creates a new product.

### Sample Request Body

```json
{
  "title": "MacBook Pro",
  "category": "Electronics",
  "minPrice": 800,
  "maxPrice": 1200,
  "sellerEmail": "seller@gmail.com"
}
```

---

## Update Product

### Endpoint

```http
PATCH /products/:productId
```

### Description

Updates product information.

### Example

```json
{
  "status": "Sold"
}
```

---

## Delete Product

### Endpoint

```http
DELETE /products/:productId
```

### Description

Deletes a product.

---

# 💰 Bids API

---

## Create Bid

### Endpoint

```http
POST /bids
```

### Description

Creates a new bid for a product.

### Sample Request Body

```json
{
  "product_id": "6865a1bc12ab34cd56ef78gh",
  "buyerEmail": "buyer@gmail.com",
  "bidAmount": 1200
}
```

---

## Get My Bids

### Endpoint

```http
GET /bids?email=user@example.com
```

### Headers

```http
Authorization: Bearer <firebase_id_token>
```

### Description

Returns all bids placed by the authenticated user.

---

## Get Product Bids

### Endpoint

```http
GET /product/bids/:productId
```

### Description

Returns all bids submitted for a specific product.

---

# 📂 Project Structure

```text
server/
│
├── index.js
├── vercel.json
├── package.json
├── .env
│
└── node_modules/
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/FahimFaysalNirjhar/smart-deals-mongodb-server-side
```

## Navigate to Project

```bash
cd smart-deals-server
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run start
```

or

```bash
nodemon index.js
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

DB_USER=your_database_user

DB_PASS=your_database_password

FIREBASE_SERVICE_KEY=your_base64_encoded_service_account
```

---

# ☁️ Vercel Deployment

Create a `vercel.json` file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
  ]
}
```

---

# 🔒 Security Features

- Firebase ID Token Verification
- Protected API Routes
- User Ownership Validation
- Environment Variable Protection
- Secure MongoDB Atlas Connection
- Server-side Authorization Checks

---

# 🚀 Future Improvements

- Pagination
- Product Filtering
- Real-Time Bidding
- Bid Notifications
- Seller Ratings
- Admin Dashboard
- Product Reports
- Analytics Dashboard

---

# 👨‍💻 Author

**Fahim Faysal**

MERN Stack Developer

GitHub: https://github.com/FahimFaysalNirjhar

LinkedIn: https://www.linkedin.com/in/fahim-faysal-a62b91153/

---

# 📄 License

This project is licensed under the MIT License.

Feel free to use, modify, and distribute this project for educational and personal purposes.
