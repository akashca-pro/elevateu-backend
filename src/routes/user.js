import express from 'express'

import {registerUser,loginUser,logoutUser,forgotPassword,verifyResetLink,
    passportCallback, authFailure ,authLoad
} from '../controllers/user/userAuth.js'

import {loadProfile,updateProfile
} from '../controllers/user/userOps.js'

import {addToCart, enrollInCourse, getCartDetails, loadEnrolledCourses} from '../controllers/enrolledCourse/userOps.js'

import {verifyAccessToken,} from '../utils/verifyToken.js'
import { validateForm } from '../middleware/validation.js'
import { strictLimiter, authLimiter, standardLimiter, readLimiter } from '../middleware/rateLimiting.js'

import { updateEmail, verifyEmail , isBlock, updatePassword, verifyOtpForPasswordChange, resendOtpForPasswordChange, softDeleteUser} from '../controllers/commonControllers.js';

import passport from 'passport'
import { loadNotifications, readNotifications } from '../controllers/notificationController.js'
import { applyCoupon, bookmarkCourse, fetchCurrentAppliedCoupon, getPricing, isBookMarked, loadBookmarkCourses, removeAppliedCoupon, removeBookmarkCourse } from '../controllers/course/userOps.js'
import { createOrder, failedPayment, verifyPayment } from '../controllers/order/userOrderOps.js'
import { changeLessonOrModuleStatus, courseDetails, isCourseEnrolled, loadSelectedLesson, progressStatus, resetCourseProgress, updateProgressTracker } from '../controllers/enrolledCourse/userLearningOps.js'
import { loadWalletDetails } from '../controllers/transactions.js'
import { loadCertificates } from '../controllers/course/certificate.js'


const router =  express.Router();

// ==================== AUTH ROUTES ====================

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Email must be verified via OTP before registration.
 *     tags: [Auth - User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/signup', authLimiter, validateForm('user','register'), registerUser)

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user and sets JWT tokens in HTTP-only cookies
 *     tags: [Auth - User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: JWT access token stored in HTTP-only cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', strictLimiter, validateForm('user','login'), loginUser)

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Sends a password reset OTP to the user's registered email
 *     tags: [Auth - User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset OTP sent to email
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/forgot-password', strictLimiter, forgotPassword)

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Verifies OTP and resets user password
 *     tags: [Auth - User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or validation error
 */
router.post('/reset-password', strictLimiter, verifyResetLink)

/**
 * @swagger
 * /api/user/logout:
 *   delete:
 *     summary: User logout
 *     description: Clears authentication cookies and logs out user
 *     tags: [Auth - User]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.delete('/logout', logoutUser)

/**
 * @swagger
 * /api/user/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: Redirects to Google OAuth consent screen
 *     tags: [Auth - User]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate("google-user",{ scope: ["profile", "email"] }))

router.get('/auth-callback', passport.authenticate("google-user",{ session : false }), passportCallback);
router.get('/auth-failure', authFailure)

/**
 * @swagger
 * /api/user/auth-load:
 *   get:
 *     summary: Load authenticated user data
 *     description: Returns current user data if authenticated
 *     tags: [Auth - User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data loaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/auth-load', verifyAccessToken('user'), readLimiter, authLoad)

/**
 * @swagger
 * /api/user/isblocked:
 *   get:
 *     summary: Check if user is blocked
 *     description: Returns whether the current user account is blocked
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User is not blocked
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/isblocked', verifyAccessToken('user'), readLimiter, isBlock('user'))

// ==================== PROFILE ROUTES ====================

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns detailed profile information for the authenticated user
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', verifyAccessToken('user'), readLimiter, loadProfile)

/**
 * @swagger
 * /api/user/update-email:
 *   patch:
 *     summary: Request email update
 *     description: Initiates email change by sending OTP to the new email address
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent to new email
 *       409:
 *         description: Email already in use
 */
router.patch('/update-email', verifyAccessToken('user'), standardLimiter, updateEmail('user'))

/**
 * @swagger
 * /api/user/verify-email:
 *   patch:
 *     summary: Verify email update with OTP
 *     description: Completes email change by verifying OTP
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, email]
 *             properties:
 *               otp:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Invalid OTP
 */
router.patch('/verify-email', verifyAccessToken('user'), strictLimiter, verifyEmail('user'))

/**
 * @swagger
 * /api/user/profile/update-password:
 *   patch:
 *     summary: Request password update
 *     description: Initiates password change by sending OTP verification
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currPass, newPass]
 *             properties:
 *               currPass:
 *                 type: string
 *               newPass:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: OTP sent for verification
 *       400:
 *         description: Current password incorrect
 */
router.patch('/profile/update-password', verifyAccessToken('user'), standardLimiter, updatePassword('user'))

/**
 * @swagger
 * /api/user/profile/update-password/re-send-otp:
 *   patch:
 *     summary: Resend password change OTP
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.patch('/profile/update-password/re-send-otp', verifyAccessToken('user'), strictLimiter, resendOtpForPasswordChange('user'))

/**
 * @swagger
 * /api/user/profile/update-password/verify-otp:
 *   patch:
 *     summary: Verify password change OTP
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch('/profile/update-password/verify-otp', verifyAccessToken('user'), strictLimiter, verifyOtpForPasswordChange('user'))

/**
 * @swagger
 * /api/user/update-profile/{id}:
 *   post:
 *     summary: Update user profile
 *     description: Updates user profile information including name, bio, date of birth, and profile image
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.post('/update-profile/:id', validateForm('user','profile'), verifyAccessToken('user'), standardLimiter, updateProfile)

/**
 * @swagger
 * /api/user/profile/deactivate-account:
 *   patch:
 *     summary: Deactivate user account
 *     description: Soft deletes user account (can be reactivated)
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.patch('/profile/deactivate-account', verifyAccessToken('user'), standardLimiter, softDeleteUser('user'))

// ==================== BOOKMARK ROUTES ====================

/**
 * @swagger
 * /api/user/bookmark-course:
 *   post:
 *     summary: Add course to bookmarks
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course bookmarked
 *   get:
 *     summary: Get all bookmarked courses
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Bookmarked courses list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseBasic'
 */
router.post('/bookmark-course', verifyAccessToken('user'), standardLimiter, bookmarkCourse)

/**
 * @swagger
 * /api/user/isBookmarked-course/{id}:
 *   get:
 *     summary: Check if course is bookmarked
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookmark status
 */
router.get('/isBookmarked-course/:id', verifyAccessToken('user'), readLimiter, isBookMarked)
router.get('/bookmark-course', verifyAccessToken('user'), readLimiter, loadBookmarkCourses)

/**
 * @swagger
 * /api/user/bookmark-course/{id}:
 *   patch:
 *     summary: Remove course from bookmarks
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookmark removed
 */
router.patch('/bookmark-course/:id', verifyAccessToken('user'), standardLimiter, removeBookmarkCourse)

// ==================== CART ROUTES ====================

/**
 * @swagger
 * /api/user/cart:
 *   post:
 *     summary: Add course to cart
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to cart
 *       409:
 *         description: Already in cart
 */
router.post('/cart', verifyAccessToken('user'), standardLimiter, addToCart)

/**
 * @swagger
 * /api/user/cart/{id}:
 *   get:
 *     summary: Get cart details
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart details
 */
router.get('/cart/:id', verifyAccessToken('user'), readLimiter, getCartDetails)

// ==================== ENROLLMENT ROUTES ====================

/**
 * @swagger
 * /api/user/enroll-course:
 *   post:
 *     summary: Enroll in a course (free course)
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enrolled successfully
 */
router.post('/enroll-course', verifyAccessToken('user'), standardLimiter, enrollInCourse)

/**
 * @swagger
 * /api/user/enrolled-courses:
 *   get:
 *     summary: Get user's enrolled courses
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrolledCourse'
 */
router.get('/enrolled-courses', verifyAccessToken('user'), readLimiter, loadEnrolledCourses)

// ==================== NOTIFICATION ROUTES ====================

/**
 * @swagger
 * /api/user/load-notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 */
router.get('/load-notifications', verifyAccessToken('user'), readLimiter, loadNotifications('user'))

/**
 * @swagger
 * /api/user/read-notifications:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [User - Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.post('/read-notifications', verifyAccessToken('user'), standardLimiter, readNotifications)

// ==================== PRICING & COUPON ROUTES ====================

/**
 * @swagger
 * /api/user/get-pricing/{id}:
 *   get:
 *     summary: Get course pricing details
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing details
 */
router.get('/get-pricing/:id', verifyAccessToken('user'), readLimiter, getPricing)

/**
 * @swagger
 * /api/user/get-applied-coupon/{id}:
 *   get:
 *     summary: Get currently applied coupon for course
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applied coupon details
 */
router.get('/get-applied-coupon/:id', verifyAccessToken('user'), readLimiter, fetchCurrentAppliedCoupon)

/**
 * @swagger
 * /api/user/apply-coupon:
 *   post:
 *     summary: Apply coupon to course
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, couponCode]
 *             properties:
 *               courseId:
 *                 type: string
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied
 *       400:
 *         description: Invalid or expired coupon
 */
router.post('/apply-coupon', verifyAccessToken('user'), standardLimiter, applyCoupon)

/**
 * @swagger
 * /api/user/remove-applied-coupon/{id}:
 *   delete:
 *     summary: Remove applied coupon
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon removed
 */
router.delete('/remove-applied-coupon/:id', verifyAccessToken('user'), standardLimiter, removeAppliedCoupon)

// ==================== ORDER ROUTES ====================

/**
 * @swagger
 * /api/user/create-order:
 *   post:
 *     summary: Create payment order
 *     description: Creates a Razorpay payment order for course purchase
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 */
router.post('/create-order', verifyAccessToken('user'), standardLimiter, createOrder)

/**
 * @swagger
 * /api/user/verify-payment:
 *   post:
 *     summary: Verify payment and complete enrollment
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentId, signature]
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified, enrollment complete
 */
router.post('/verify-payment', verifyAccessToken('user'), standardLimiter, verifyPayment)

/**
 * @swagger
 * /api/user/failed-payment/{id}:
 *   patch:
 *     summary: Mark payment as failed
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment marked as failed
 */
router.patch('/failed-payment/:id', verifyAccessToken('user'), standardLimiter, failedPayment)

// ==================== LEARNING PROGRESS ROUTES ====================

/**
 * @swagger
 * /api/user/check-enrollment/{id}:
 *   get:
 *     summary: Check if user is enrolled in course
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isEnrolled:
 *                       type: boolean
 */
router.get('/check-enrollment/:id', verifyAccessToken('user'), readLimiter, isCourseEnrolled)

/**
 * @swagger
 * /api/user/update-progress-tracker/{id}:
 *   patch:
 *     summary: Update course progress tracker
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.patch('/update-progress-tracker/:id', verifyAccessToken('user'), standardLimiter, updateProgressTracker)

/**
 * @swagger
 * /api/user/enrolled-course/course-details/{id}:
 *   get:
 *     summary: Get enrolled course details with progress
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details with progress
 */
router.get('/enrolled-course/course-details/:id', verifyAccessToken('user'), readLimiter, courseDetails)

/**
 * @swagger
 * /api/user/enrolled-course/current-status/{id}:
 *   get:
 *     summary: Get current progress status
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress status
 */
router.get('/enrolled-course/current-status/:id', verifyAccessToken('user'), readLimiter, progressStatus)

/**
 * @swagger
 * /api/user/enrolled-course/lesson-status:
 *   put:
 *     summary: Mark lesson/module as complete
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollmentId:
 *                 type: string
 *               lessonId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/enrolled-course/lesson-status', verifyAccessToken('user'), standardLimiter, changeLessonOrModuleStatus)

/**
 * @swagger
 * /api/user/lesson:
 *   get:
 *     summary: Load selected lesson content
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: lessonId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson content
 */
router.get('/lesson', verifyAccessToken('user'), readLimiter, loadSelectedLesson)

/**
 * @swagger
 * /api/user/reset-progress/{id}:
 *   put:
 *     summary: Reset course progress
 *     tags: [User - Learning]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress reset
 */
router.put('/reset-progress/:id', verifyAccessToken('user'), standardLimiter, resetCourseProgress)

// ==================== WALLET ROUTES ====================

/**
 * @swagger
 * /api/user/wallet:
 *   get:
 *     summary: Get wallet details
 *     description: Returns user wallet balance and transaction history
 *     tags: [User - Wallet]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions to return
 *     responses:
 *       200:
 *         description: Wallet details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 */
router.get('/wallet', verifyAccessToken('user'), readLimiter, loadWalletDetails('User'))

// ==================== CERTIFICATE ROUTES ====================

/**
 * @swagger
 * /api/user/certificates:
 *   get:
 *     summary: Get user's certificates
 *     description: Returns list of certificates for completed courses
 *     tags: [User - Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of certificates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       courseId:
 *                         type: string
 *                       courseName:
 *                         type: string
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       certificateUrl:
 *                         type: string
 */
router.get('/certificates', verifyAccessToken('user'), readLimiter, loadCertificates)


export default router