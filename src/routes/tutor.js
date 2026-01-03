import express from 'express'

import {registerTutor, loginTutor, forgotPassword, verifyResetLink, logoutTutor ,
    passportCallback,authFailure,authLoad, isTutorVerified
} from '../controllers/tutor/tutorAuth.js'

import {loadProfile,updateProfile,requestVerification
} from '../controllers/tutor/tutorOps.js'

import { verifyAccessToken} from '../utils/verifyToken.js'
import { strictLimiter, authLimiter, standardLimiter, readLimiter } from '../middleware/rateLimiting.js';
import { validateForm } from '../middleware/validation.js'

import { updateEmail, verifyEmail, isBlock, resendOtpForPasswordChange, verifyOtpForPasswordChange, updatePassword, softDeleteUser} from '../controllers/commonControllers.js';

import {createCourse, updateCourse, requestPublish, deleteCourse, loadCourses, courseDetails,
courseTitleExist,
} from '../controllers/course/tutorOps.js'
import passport from 'passport';
import { loadNotifications, readNotifications } from '../controllers/notificationController.js';
import { loadWalletDetails } from '../controllers/transactions.js';
import { addBankAccountDetails, intiateWithdrawalRequest, loadExistingBankDetails, loadWithdrawalRequest } from '../controllers/wallet/tutorWallet.js';


const router = express.Router()

// ==================== AUTH ROUTES ====================

/**
 * @swagger
 * /api/tutor/signup:
 *   post:
 *     summary: Register a new tutor
 *     description: Creates a new tutor account. Email must be verified via OTP before registration.
 *     tags: [Auth - Tutor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tutor@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *                 example: John
 *     responses:
 *       200:
 *         description: Tutor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/signup', authLimiter, validateForm('tutor','register'), registerTutor)

/**
 * @swagger
 * /api/tutor/login:
 *   post:
 *     summary: Tutor login
 *     description: Authenticates tutor and sets JWT tokens in HTTP-only cookies
 *     tags: [Auth - Tutor]
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
 *             description: JWT access token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', strictLimiter, validateForm('tutor','login'), loginTutor)

/**
 * @swagger
 * /api/tutor/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth - Tutor]
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
 *         description: Reset OTP sent
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/forgot-password', strictLimiter, forgotPassword)

/**
 * @swagger
 * /api/tutor/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth - Tutor]
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
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', strictLimiter, verifyResetLink)

/**
 * @swagger
 * /api/tutor/logout:
 *   delete:
 *     summary: Tutor logout
 *     tags: [Auth - Tutor]
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
 */
router.delete('/logout', logoutTutor)

/**
 * @swagger
 * /api/tutor/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth - Tutor]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate('google-tutor',{ scope: ["profile", "email"] }))

router.get('/auth-callback', passport.authenticate('google-tutor',{ session : false , 
    failureRedirect : '/auth-failure' }), passportCallback);
router.get('/auth-failure', authFailure)

/**
 * @swagger
 * /api/tutor/auth-load:
 *   get:
 *     summary: Load authenticated tutor data
 *     tags: [Auth - Tutor]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tutor data loaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/auth-load', verifyAccessToken('tutor'), readLimiter, authLoad)

/**
 * @swagger
 * /api/tutor/is-verified:
 *   get:
 *     summary: Check if tutor is admin verified
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Verification status
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
 *                     isVerified:
 *                       type: boolean
 */
router.get('/is-verified', verifyAccessToken('tutor'), readLimiter, isTutorVerified)

/**
 * @swagger
 * /api/tutor/isblocked:
 *   get:
 *     summary: Check if tutor is blocked
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tutor is not blocked
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/isblocked', verifyAccessToken('tutor'), readLimiter, isBlock('tutor'))

// ==================== PROFILE ROUTES ====================

/**
 * @swagger
 * /api/tutor/profile:
 *   get:
 *     summary: Get tutor profile
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tutor'
 */
router.get('/profile', verifyAccessToken('tutor'), readLimiter, loadProfile)

/**
 * @swagger
 * /api/tutor/update-email:
 *   patch:
 *     summary: Request email update
 *     tags: [Tutor - Profile]
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
 */
router.patch('/update-email', verifyAccessToken('tutor'), standardLimiter, updateEmail('tutor'))

/**
 * @swagger
 * /api/tutor/verify-email:
 *   patch:
 *     summary: Verify email update with OTP
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Email updated successfully
 */
router.patch('/verify-email', verifyAccessToken('tutor'), strictLimiter, verifyEmail('tutor'))

/**
 * @swagger
 * /api/tutor/profile/update-password:
 *   patch:
 *     summary: Request password update
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OTP sent for verification
 */
router.patch('/profile/update-password', verifyAccessToken('tutor'), standardLimiter, updatePassword('tutor'))
router.patch('/profile/update-password/re-send-otp', verifyAccessToken('tutor'), strictLimiter, resendOtpForPasswordChange('tutor'))
router.patch('/profile/update-password/verify-otp', verifyAccessToken('tutor'), strictLimiter, verifyOtpForPasswordChange('tutor'))

/**
 * @swagger
 * /api/tutor/update-profile:
 *   post:
 *     summary: Update tutor profile
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
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
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: string
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/update-profile', verifyAccessToken('tutor'), standardLimiter, validateForm('tutor','profile'), updateProfile)

/**
 * @swagger
 * /api/tutor/profile/deactivate-account:
 *   patch:
 *     summary: Deactivate tutor account
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.patch('/profile/deactivate-account', verifyAccessToken('tutor'), standardLimiter, softDeleteUser('tutor'))

/**
 * @swagger
 * /api/tutor/request-verification/{id}:
 *   patch:
 *     summary: Request admin verification
 *     description: Sends verification request to admin for tutor account verification
 *     tags: [Tutor - Profile]
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
 *         description: Verification request sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.patch('/request-verification/:id', verifyAccessToken('tutor'), standardLimiter, requestVerification)

// ==================== COURSE MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/tutor/create-course:
 *   post:
 *     summary: Create a new course
 *     description: Creates a new course with modules and lessons
 *     tags: [Tutor - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formData:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   level:
 *                     type: string
 *                     enum: [Beginner, Intermediate, Advanced]
 *                   thumbnail:
 *                     type: string
 *                   modules:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Module'
 *               draft:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     courseId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/create-course', verifyAccessToken('tutor'), standardLimiter, createCourse)

/**
 * @swagger
 * /api/tutor/courses:
 *   get:
 *     summary: Get tutor's courses
 *     description: Returns paginated list of courses created by the tutor
 *     tags: [Tutor - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CourseBasic'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/courses', verifyAccessToken('tutor'), readLimiter, loadCourses)

/**
 * @swagger
 * /api/tutor/view-course/{id}:
 *   get:
 *     summary: Get course details
 *     description: Returns full course details including all modules and lessons
 *     tags: [Tutor - Courses]
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
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/view-course/:id', verifyAccessToken('tutor'), readLimiter, courseDetails)

/**
 * @swagger
 * /api/tutor/update-course:
 *   post:
 *     summary: Update course
 *     tags: [Tutor - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, formData]
 *             properties:
 *               courseId:
 *                 type: string
 *               formData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Course updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/update-course', verifyAccessToken('tutor'), standardLimiter, updateCourse)

/**
 * @swagger
 * /api/tutor/publish-course:
 *   post:
 *     summary: Request course publication
 *     description: Submits course for admin review and approval
 *     tags: [Tutor - Courses]
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
 *         description: Publish request submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/publish-course', verifyAccessToken('tutor'), standardLimiter, validateForm('tutor','course'), requestPublish)

/**
 * @swagger
 * /api/tutor/delete-course/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Tutor - Courses]
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
 *         description: Course deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/delete-course/:id', verifyAccessToken('tutor'), standardLimiter, deleteCourse)

/**
 * @swagger
 * /api/tutor/check-title:
 *   get:
 *     summary: Check if course title exists
 *     tags: [Tutor - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Title availability
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
 *                     exists:
 *                       type: boolean
 */
router.get('/check-title', verifyAccessToken('tutor'), readLimiter, courseTitleExist)

// ==================== NOTIFICATION ROUTES ====================

/**
 * @swagger
 * /api/tutor/load-notifications:
 *   get:
 *     summary: Get tutor notifications
 *     tags: [Tutor - Profile]
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
router.get('/load-notifications', verifyAccessToken('tutor'), readLimiter, loadNotifications('tutor'))

/**
 * @swagger
 * /api/tutor/read-notifications:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Tutor - Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.post('/read-notifications', verifyAccessToken('tutor'), standardLimiter, readNotifications)

// ==================== WALLET & BANK ROUTES ====================

/**
 * @swagger
 * /api/tutor/wallet:
 *   get:
 *     summary: Get wallet details
 *     description: Returns tutor wallet balance, earnings, withdrawals, and transaction history
 *     tags: [Tutor - Wallet]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Wallet details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 */
router.get('/wallet', verifyAccessToken('tutor'), readLimiter, loadWalletDetails('Tutor'))

/**
 * @swagger
 * /api/tutor/bank-details:
 *   get:
 *     summary: Get saved bank details
 *     tags: [Tutor - Wallet]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Bank details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BankDetails'
 *       204:
 *         description: No bank details found
 *   post:
 *     summary: Add/update bank details
 *     tags: [Tutor - Wallet]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formData]
 *             properties:
 *               formData:
 *                 $ref: '#/components/schemas/BankDetails'
 *     responses:
 *       200:
 *         description: Bank details saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/bank-details', verifyAccessToken('tutor'), readLimiter, loadExistingBankDetails)
router.post('/bank-details', verifyAccessToken('tutor'), standardLimiter, addBankAccountDetails)

/**
 * @swagger
 * /api/tutor/withdrawal-request:
 *   post:
 *     summary: Initiate withdrawal request
 *     description: Creates a withdrawal request that will be processed by admin
 *     tags: [Tutor - Wallet]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formData]
 *             properties:
 *               formData:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     example: 5000
 *                   method:
 *                     type: string
 *                     enum: [gpay, bank]
 *     responses:
 *       200:
 *         description: Withdrawal request submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Insufficient funds or missing bank details
 *       409:
 *         description: Pending request already exists
 *   get:
 *     summary: Get pending withdrawal request
 *     tags: [Tutor - Wallet]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal request status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: string
 *                   example: "Withdrawal of ₹5000 is pending"
 *       204:
 *         description: No pending request
 */
router.post('/withdrawal-request', verifyAccessToken('tutor'), standardLimiter, intiateWithdrawalRequest)
router.get('/withdrawal-request', verifyAccessToken('tutor'), readLimiter, loadWithdrawalRequest)

export default router