# ElevateU

**ElevateU** is a full-featured **e-learning platform** built with **Node.js and JavaScript**, designed as a **production-grade monolithic application** following the **MVC architecture**. It supports **Users, Tutors, and Admins**, with secure authentication, paid course enrollment, progress tracking, certifications, real-time notifications, and a complete revenue and wallet system.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Server starts at http://localhost:9000
# API Docs at http://localhost:9000/api/docs
```

---

## API Documentation

Interactive Swagger documentation is available at:

- **Swagger UI**: `GET /api/docs` - Interactive API explorer
- **OpenAPI JSON**: `GET /api/docs/json` - Download raw specification

The API includes **108 documented endpoints** across User, Tutor, and Admin roles.

---

## Architecture Overview

- Monolithic backend with MVC architecture
- RESTful API design with OpenAPI 3.0 documentation
- MongoDB as primary database
- Socket.IO for real-time notifications
- Pino structured logging
- Dockerized and deployed via CI/CD to Google Cloud Run

---

## Tech Stack

| Category           | Technologies                                |
| ------------------ | ------------------------------------------- |
| **Runtime**        | Node.js, Express.js                         |
| **Database**       | MongoDB, Mongoose ODM                       |
| **Authentication** | JWT, Passport.js (Google OAuth)             |
| **Payments**       | Razorpay                                    |
| **Real-time**      | Socket.IO                                   |
| **Security**       | Helmet, express-mongo-sanitize, bcrypt      |
| **Logging**        | Pino, pino-pretty                           |
| **Documentation**  | Swagger (swagger-jsdoc, swagger-ui-express) |
| **Validation**     | express-validator                           |
| **Scheduling**     | node-cron                                   |

---

## User Roles

### User

- Browse, bookmark, and purchase courses
- Email/password authentication and Google OAuth
- Lesson-wise, module-wise, and course-wise progress tracking
- Dynamic 5-level achievement system
- Auto-generated certificates on course completion
- Wallet, transactions, and purchase history
- Real-time notifications

### Tutor

- Tutor onboarding with admin verification
- Create, update, and delete courses
- Draft up to three incomplete courses
- Wallet with earnings breakdown (80% revenue share)
- Withdrawal requests with admin approval
- Real-time notifications

### Admin

- Full platform control
- User and tutor management
- Course approval, suspension, and deletion
- Category and coupon management
- Analytics dashboard with revenue insights

---

## Security Features

| Feature               | Implementation                   |
| --------------------- | -------------------------------- |
| **Authentication**    | JWT with HTTP-only cookies       |
| **Password Security** | bcrypt hashing                   |
| **OAuth**             | Google OAuth 2.0 via Passport.js |
| **Rate Limiting**     | Tiered limits (3-200 req/15min)  |
| **Input Validation**  | express-validator                |
| **NoSQL Injection**   | express-mongo-sanitize           |
| **Security Headers**  | Helmet.js                        |
| **OTP Verification**  | Email-based with expiry          |

### Rate Limiting Tiers

| Tier     | Limit     | Applied To                 |
| -------- | --------- | -------------------------- |
| Strict   | 3/15min   | Login, OTP, Password reset |
| Auth     | 10/15min  | Signup, Verification       |
| Standard | 100/15min | Write operations           |
| Read     | 200/15min | Read operations            |
| Public   | 50/15min  | Unauthenticated routes     |

---

## Payments & Revenue Model

- Razorpay payment gateway integration
- Coupon support (percentage and fixed)
- GST calculation
- Revenue split: **80% tutor, 20% platform**
- Transaction ledger for all wallets
- Withdrawal system with admin approval

---

## Project Structure

```
src/
├── config/              # Database, Passport, Swagger, constants
│   ├── db.js           # MongoDB connection with retry logic
│   ├── passport.js     # Google OAuth strategies
│   ├── swagger.js      # OpenAPI specification
│   ├── constants.js    # Centralized configuration
│   └── roleModels.js   # Role-to-model mapping
├── controllers/         # Role-based business logic
│   ├── user/           # User auth & operations
│   ├── tutor/          # Tutor auth & operations
│   ├── admin/          # Admin operations
│   ├── course/         # Course management
│   ├── order/          # Payment & orders
│   ├── wallet/         # Wallet operations
│   └── analytics/      # Dashboard analytics
├── cron/                # Scheduled cleanup jobs
├── middleware/          # Request processing
│   ├── validation.js   # Input validation rules
│   ├── rateLimiting.js # Tiered rate limiters
│   ├── isBlocked.js    # Block check middleware
│   └── errorHandling.js# Error handlers
├── model/               # Mongoose schemas (18 models)
├── routes/              # API routing with Swagger docs
│   ├── user.js         # 35 user endpoints
│   ├── tutor.js        # 25 tutor endpoints
│   ├── admin.js        # 40 admin endpoints
│   └── common.js       # 8 public endpoints
├── services/            # Socket server
├── utils/               # Helpers
│   ├── logger.js       # Pino logger configuration
│   ├── verifyToken.js  # JWT verification
│   ├── tokenManage.js  # Cookie management
│   └── responseHandler.js # Standardized responses
└── server.js            # Application bootstrap
```

---

## Environment Variables

```env
# Server
PORT=9000
NODE_ENV=development

# Database
MONGO_URL=mongodb://localhost:27017/elevateu

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:9000/api/user/auth-callback

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email (Nodemailer)
EMAIL_USER=your_email
EMAIL_PASS=your_password

# Client URLs
CLIENT_URL=http://localhost:3000
```

---

## API Endpoints Overview

| Category            | Endpoints | Description                        |
| ------------------- | --------- | ---------------------------------- |
| **Public**          | 8         | OTP, categories, courses           |
| **User Auth**       | 7         | Login, signup, OAuth, logout       |
| **User Profile**    | 10        | Profile, email, password           |
| **User Courses**    | 18        | Enrollment, learning, certificates |
| **Tutor Auth**      | 7         | Login, signup, OAuth               |
| **Tutor Courses**   | 8         | Create, update, publish            |
| **Tutor Wallet**    | 5         | Earnings, withdrawals              |
| **Admin Users**     | 6         | User CRUD, block                   |
| **Admin Tutors**    | 8         | Tutor CRUD, verification           |
| **Admin Courses**   | 6         | Approval, suspension               |
| **Admin Analytics** | 10        | Dashboard, revenue                 |

---

## Docker Deployment

```bash
# Build image
docker build -t elevateu-backend .

# Run container
docker run -p 9000:9000 --env-file .env elevateu-backend
```

---

## CI/CD Pipeline

- Feature/dev branch push triggers build and tests
- Pull request to main triggers production build
- Docker image pushed to Docker Hub
- Automatic deployment to Google Cloud Run

---

## Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-03T10:00:00.000Z",
  "database": "connected",
  "uptime": 3600
}
```

---

## Key Highlights

- Production-ready e-learning platform
- 108 fully documented API endpoints
- Comprehensive security with tiered rate limiting
- Structured logging with Pino
- Complete payment and wallet lifecycle
- Real-time notifications via Socket.IO
- Clean MVC architecture

---

## License

MIT
