# CoreHub API

 A modular, plug-and-play, production-ready backend engine designed for rapid frontend prototyping, hackathons, and scalable applications.


CoreHub API is built to eliminate the repetitive setup of authentication, database configuration, and error handling. Out of the box, it provides a highly secure, MongoDB-backed authentication system using JWTs, HTTP-only cookies, and transactional emails.

## Features

* **Complete Authentication Lifecycle:** Register, Login, Logout, Verify Email, Forgot Password, and Reset Password.
* **Bulletproof Security:** Passwords hashed via `bcrypt`, tokens managed via `jsonwebtoken`, and sessions secured with `httpOnly` cookies.
* **Modern Error Handling:** Built on **Express 5**, utilizing a custom `ApiError` class and an `asyncHandler` to eliminate `try/catch` hell and prevent server crashes.
* **Data Validation:** Strict request validation using `express-validator`.
* **Beautiful Transactional Emails:** Automated UI-rich emails for verification and password resets using `Nodemailer` and `Mailgen`.
* **Docker Ready:** Spin up a local MongoDB database instantly with the included `docker-compose.yml`.

## Tech Stack

* **Runtime:** Node.js (v20+)
* **Framework:** Express.js (v5.3+)
* **Database:** MongoDB (via Mongoose ORM)
* **Authentication:** JWT & bcrypt
* **Emails:** Nodemailer & Mailgen (Tested with Mailtrap)
* **Validation:** express-validator
* **Containerization:** Docker

## Getting Started

Follow these steps to get your local development environment up and running.

### 1. Prerequisites

* [Node.js](https://nodejs.org/) (v20 or higher)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (For running MongoDB locally without installing it on your OS)
* [Git](https://git-scm.com/)

### 2. Fork and Clone

1. **Fork** this repository by clicking the "Fork" button at the top right of this page.
2. **Clone** your forked repository to your local machine:

   ```bash
   git clone https://github.com/HimanshuKumarShahi/corehub-api.git

   cd corehub-api
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root directory and add the following configuration. *(Note: Create a free account on [Mailtrap.io](https://mailtrap.io/) to get your SMTP credentials).*

```env

PORT=8000
CORS_ORIGIN=* (add frontend url here)

# MongoDB Configuration  - locally in Docker

MONGO_URI=mongodb://localhost:27017/corehub

# MONGO_URI= if using mogoDb Atlas then add connection string.



# JWT Secrets (Generate random strings for these)

ACCESS_TOKEN_SECRET=accesskey
ACCESS_TOKEN_EXPIRY=12h

REFRESH_TOKEN_SECRET=refreshkey
REFRESH_TOKEN_EXPIRY=10d

# Mailtrap Credentials (For testing emails)

MAILTRAP_SMPT_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMPT_PORT=2525
MAILTRAP_SMPT_USER=username
MAILTRAP_SMPT_PASS=password

```

### 5. Run the Engine (Two Ways)

CoreHub is flexible. You can run the entire system inside Docker, or run the database in Docker while keeping the server local for fast development.

**Option A: 100% Docker (Easiest)**
Run both the MongoDB database and the Node.js backend inside Docker containers. Perfect for instant setup.
```bash
# Make sure Docker Desktop is running, then execute:

docker compose up -d
```
*The API is now running at `http://localhost:8000`.*

**Option B: Local Development (Best for coding)**
Run only MongoDB in Docker, and run the Node.js server on your local machine to take advantage of Nodemon's hot-reloading.
```bash
# 1. Start ONLY the database in the background

docker compose up -d mongo

# 2. Start the Node.js server locally

npm run dev

```
*You should see:*
```text
✅ MongoDB Connected
Server is listening on port 8000
```

---

## How to Use for Hackathons & Frontend Development

CoreHub is designed to be completely out of your way so you can focus 100% on building your React, Next.js, Vue, or Angular frontend.

1. **Zero Config Connections:** Run the server using the steps above. Your frontend can instantly connect to `http://localhost:8000`.
2. **CORS Ready:** CORS is pre-configured to accept requests from `http://localhost:5173` (Vite's default) or any URL you specify in the `CORS_ORIGIN` `.env` variable. No frustrating cross-origin errors.
3. **Pre-built Authentication:** Do not waste hackathon hours writing auth logic. Your frontend can immediately start sending user data to the `/api/v1/auth/*` endpoints. Secure `httpOnly` cookies are handled automatically by the backend.

---

## How to Access & Test the API

The easiest way to test the flow before writing frontend code is by using **Postman** or **Insomnia**.

1. **Health Check:** 
   `GET http://localhost:8000/api/v1/healthcheck`
2. **Register a User:** 
   `POST http://localhost:8000/api/v1/auth/register`
   *(Pass `email`, `username`, `password`, and `fullName` in the raw JSON body)*
3. **Check Mailtrap:** 
   Open your [Mailtrap](https://mailtrap.io/) inbox to view the auto-generated HTML verification emails. Copy the "Postman Test Token" provided directly in the email UI to test the verification endpoints.
4. **Login:** 
   `POST http://localhost:8000/api/v1/auth/login`
   *(Check the **Cookies** tab in Postman after logging in—your `accessToken` and `refreshToken` will be automatically set and secured!)*

---

## How the Code Works

CoreHub is strictly structured using the **MVC (Model-View-Controller)** architecture, ensuring maximum modularity.

### Directory Structure Overview

* **`/src/models/auth`**: Defines the Mongoose schemas (e.g., `User.models.js`). This is where we define database guardrails using strict Types and Enums.
* **`/src/controllers/auth`**: Contains the core business logic. Controllers receive requests, interact with models, and send `ApiResponse` objects back.
* **`/src/routes/auth`**: Maps HTTP verbs (GET, POST) and endpoints to specific controllers.
* **`/src/validators`**: Contains `express-validator` logic to ensure incoming request bodies contain valid emails, strong passwords, etc., *before* hitting the controller.
* **`/src/middlewares/auth`**: Functions that run between the route and the controller (e.g., `verifyJWT` to block unauthenticated users).

### The Authentication Flow

1. **Registration:** User submits data -> Validator checks it -> Controller hashes password, saves to DB, generates a single-use crypto token, and emails a verification link.
2. **Login:** Verifies credentials -> Generates an `accessToken` (short-lived) and `refreshToken` (long-lived) -> Saves them securely in the user's browser via `httpOnly` cookies.
3. **Protected Routes:** The `verifyJWT` middleware reads the `accessToken` from the cookie, decodes the user ID, fetches the user from MongoDB, and attaches it to `req.user`.

### Error Handling

We use a centralized error handling mechanism:

1. `ApiError.js`: A custom class to standardize error responses (status codes, messages, stack traces).
2. `asyncHandler.js`: A wrapper function that catches any Promise rejections and safely passes them to Express's `next()` function.
3. **Global Error Middleware**: Sitting at the bottom of `app.js`, it intercepts any errors thrown by the controllers and sends a clean JSON response to the client, preventing server crashes.
