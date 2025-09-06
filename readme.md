
---

# AI Chat Rate Limiter Documentation

## System Architecture

The AI Chat Rate Limiter is built using **Node.js** and **Express**, with **SQLite** for persistent storage. The architecture is designed to efficiently enforce rate limits while minimizing AI usage costs.

### Components

* **Express Server**: Handles HTTP requests and routes.
* **Rate Limiting Middleware**: Checks user/IP usage before allowing access to the AI endpoint.
* **User Authentication**: JWT-based login system for identifying users.
* **In-Memory Cache**: Tracks request counts per user/IP for fast access and low latency.
* **Persistent Database (SQLite)**: Stores user accounts, tiers, and usage for reliability and recovery.
* **Vercel AI SDK Integration**: Connects to Gemini AI for chat responses.
* **Scheduled Cleanup**: Removes inactive users from memory to optimize resources.

### Request Flow

1. User sends a request to `/api/ai/chat`.
2. Rate limiting middleware checks the user’s tier and usage (by user ID or IP).
3. If under the limit, the request proceeds to the AI service.
4. If over the limit, an error response is returned and the AI is not called.

### Why This Design?

* **Fixed Window Rate Limiting**: Simple and predictable; resets every hour.
* **In-Memory Tracking**: Fast, low-latency checks for active users; avoids frequent database reads.
* **Database Sync**: Ensures usage persists across server restarts and supports analytics.
* **Tiered Limits**: Supports business requirements for cost control and premium features.
* **Pre-AI Check**: Prevents unnecessary AI calls, saving costs.
* **JWT Authentication**: Secure and scalable user identification.

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Server

```bash
npm start
```

Server runs at `http://localhost:3000`.

### Run Database Migrations

```bash
npm run migrate
```

### Run Tests

* Guest Tier Test:

```bash
npm run test:guest
```

* Free Tier Test:

```bash
npm run test:free
```

* Premium Tier Test:

```bash
npm run test:premium
```

---

# Free Tier Testing (8 requests/hour)

## Step 1: Signing Up User

```json
{
  "username": "testfree1757141925037",
  "email": "testfree1757141925038@example.com",
  "password": "password123"
}
```

**Signup Response:**

* Status: `200`
* Body:

```json
{
  "message": "Signup successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInRpZXIiOiJmcmVlIiwiaWF0IjoxNzU3MTQxOTI1LCJleHAiOjE3NTcxNDU1MjV9.CCZ1nf1gL3gpcS5Sxntxk-LX5Tb0_QCWKkNovDEHzvA"
}
```

## Step 2: Logging In User

* Email: `testfree1757141925038@example.com`

**Login Response:**

* Status: `200`
* Body:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInRpZXIiOiJmcmVlIiwiaWF0IjoxNzU3MTQxOTI1LCJleHAiOjE3NTcxNDU1MjV9.CCZ1nf1gL3gpcS5Sxntxk-LX5Tb0_QCWKkNovDEHzvA"
}
```

## Step 3: Making AI Requests to `/api/ai/chat`

| Request | Status | Response                                                                                                         |
| ------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| 1       | 200    | `{"success":true,"message":"working!\n","remaining_requests":7}`                                                 |
| 2       | 200    | `{"success":true,"message":"working!\n","remaining_requests":6}`                                                 |
| 3       | 200    | `{"success":true,"message":"working!\n","remaining_requests":5}`                                                 |
| 4       | 200    | `{"success":true,"message":"working!\n","remaining_requests":4}`                                                 |
| 5       | 200    | `{"success":true,"message":"working!\n","remaining_requests":3}`                                                 |
| 6       | 200    | `{"success":true,"message":"working!\n","remaining_requests":2}`                                                 |
| 7       | 200    | `{"success":true,"message":"working!\n","remaining_requests":1}`                                                 |
| 8       | 200    | `{"success":true,"message":"working!\n","remaining_requests":0}`                                                 |
| 9       | 429    | `{"success":false,"error":"Too many requests. Free users can make 8 requests per hour.","remaining_requests":0}` |
| 10      | 429    | `{"success":false,"error":"Too many requests. Free users can make 8 requests per hour.","remaining_requests":0}` |

## ✅ Free Tier Test Completed

---

# Guest Tier Testing (3 requests/hour)

## Step 1: Making AI Requests to `/api/ai/chat`

| Request | Status | Response                                                                                                                                                |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | 200    | `{"success":true,"message":"Dhaka is the capital of Bangladesh.\n","remaining_requests":2}`                                                             |
| 2       | 200    | `{"success":true,"message":"Dhaka is the capital of Bangladesh.\n","remaining_requests":1}`                                                             |
| 3       | 200    | `{"success":true,"message":"Dhaka\n","remaining_requests":0}`                                                                                           |
| 4       | 429    | `{"success":false,"error":"Too many requests. Guest users can make 3 requests per hour. Please sign up or log in to continue.","remaining_requests":0}` |

## ✅ Guest Tier Test Completed

---

---

# Platinum Tier Testing (10 requests/hour)

## Step 1: Signing Up User

```json
{
  "username": "testpremium1234567890",
  "email": "testpremium1234567890@example.com",
  "password": "password123"
}
```

**Signup Response:**

* Status: `200`
* Body:

```json
{
  "message": "Signup successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6XXwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.XXXXXX"
}
```

## Step 2: Upgrade to Premium Tier

**User-tier update Response:**

* Status: `200`
* Body:

```json
{
  "message": "User upgraded to Premium tier"
}
```

## Step 3: Logging In User

* Email: `testpremium1234567890@example.com`

**Login Response:**

* Status: `200`
* Body:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6XXwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.XXXXXX"
}
```

## Step 4: Making AI Requests to `/api/ai/chat`

| Request | Status | Response                                                                                                             |
| ------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| 1       | 200    | `{"success":true,"message":"working now!","remaining_requests":9}`                                                   |
| 2       | 200    | `{"success":true,"message":"working now!","remaining_requests":8}`                                                   |
| 3       | 200    | `{"success":true,"message":"working now!","remaining_requests":7}`                                                   |
| 4       | 200    | `{"success":true,"message":"working now!","remaining_requests":6}`                                                   |
| 5       | 200    | `{"success":true,"message":"working now!","remaining_requests":5}`                                                   |
| 6       | 200    | `{"success":true,"message":"working now!","remaining_requests":4}`                                                   |
| 7       | 200    | `{"success":true,"message":"working now!","remaining_requests":3}`                                                   |
| 8       | 200    | `{"success":true,"message":"working now!","remaining_requests":2}`                                                   |
| 9       | 200    | `{"success":true,"message":"working now!","remaining_requests":1}`                                                   |
| 10      | 200    | `{"success":true,"message":"working now!","remaining_requests":0}`                                                   |
| 11      | 429    | `{"success":false,"error":"Too many requests. Premium users can make 10 requests per hour.","remaining_requests":0}` |
| 12      | 429    | `{"success":false,"error":"Too many requests. Premium users can make 10 requests per hour.","remaining_requests":0}` |

## ✅ Platinum Tier Test Completed

---


