# ElevateU

**ElevateU** is a full-featured **e-learning platform** built with **Node.js and JavaScript**, designed as a **production-grade monolithic application** following the **MVC architecture**. It supports **Users, Tutors, and Admins**, with secure authentication, paid course enrollment, progress tracking, certifications, real-time notifications, and a complete revenue and wallet system.

---

## Architecture Overview

* Monolithic backend
* MVC architecture
* RESTful API design
* Reusable service-oriented controllers
* MongoDB as primary database
* Socket.IO for real-time notifications
* Dockerized and deployed via CI/CD to Google Cloud Run

---

## User Roles

### User

* Browse, bookmark, and purchase courses
* Email/password authentication and Google OAuth
* Lesson-wise, module-wise, and course-wise progress tracking
* Dynamic 5-level achievement system
* Auto-generated certificates on course completion
* Course progress reset and re-learning support
* Wallet, transactions, and purchase history
* Real-time notifications

### Tutor

* Tutor onboarding with admin verification
* Create, update, and delete courses
* Draft up to three incomplete courses for future completion
* Course edits require admin re-approval
* Post-enrollment modules supported for existing students
* Wallet with earnings breakdown
* Withdrawal requests with admin approval
* Real-time notifications

### Admin

* Full platform control
* User and tutor management
* Tutor verification workflow
* Course approval, suspension, and deletion
* Category and coupon management
* Order and transaction management
* Wallet and withdrawal approvals
* Analytics dashboard with revenue, top courses, and categories

---

## Authentication & Security

* Email/password authentication
* Google OAuth using Passport.js
* Email OTP verification
* Password change with OTP
* Email change verification
* Access and refresh token handling
* Role-based access control
* Rate limiting and request validation

---

## Payments & Revenue Model

* Razorpay payment gateway integration
* Coupon support (percentage and fixed)
* GST calculation
* Revenue split: 80 percent to tutor, 20 percent to platform
* Transaction ledger for user, tutor, and admin wallets
* Withdrawal system with admin approval

---

## Course Structure

* Courses contain multiple modules
* Modules contain multiple lessons
* Lessons support attachments and media
* Dynamic progress tracking at lesson, module, and course levels
* Courses mapped into five achievement levels irrespective of module count
* Post-enrollment modules supported
* Automatic certificate generation on completion

---

## Real-Time Notifications

* Implemented using Socket.IO
* Events include enrollments, approvals, verification requests, and withdrawals
* Read and unread tracking
* Periodic cleanup via cron jobs

---

## Folder Structure

```
src/
├── config/              # Database, Passport, environment configs
├── controllers/         # Role-based business logic
├── cron/                # Scheduled cleanup jobs
├── middleware/          # Validation, rate limiting, error handling
├── model/               # Mongoose schemas
├── routes/              # API routing per role
├── services/            # Socket server
├── utils/               # Helpers (OTP, tokens, Razorpay, email, etc.)
├── server.js            # Application bootstrap
```

---

## CI/CD Pipeline

* Feature or dev branch push triggers build and tests
* Pull request to main triggers production build
* Docker image pushed to Docker Hub
* Automatic deployment to Google Cloud Run

No manual deployment steps.

---

## Local Development

Install dependencies:

```
npm install
```

Run locally:

```
npm run dev
```

Docker build:

```
docker build -t elevateu .
```

---

## Key Highlights

* Real-world e-learning business logic
* Complete payment, wallet, and payout lifecycle
* Robust progress tracking and certification system
* Clean MVC separation
* Scalable and maintainable API structure

---

## License

MIT
