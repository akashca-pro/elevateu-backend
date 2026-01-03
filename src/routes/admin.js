import express from 'express'

import {registerAdmin, loginAdmin, logoutAdmin, loadProfile, updateProfile
} from '../controllers/admin/adminAuth.js'

import {addUser,loadUsers,loadUserDetails,updateUserDetails,deleteUser,toggleUserBlock    
} from '../controllers/admin/adminUserOps.js'

import {addTutor,loadTutors,loadTutorDetails,updateTutorDetails,deleteTutor,
loadRequests,approveOrRejectrequest,toggleTutorBlock
} from '../controllers/admin/adminTutorOps.js'

import {loadCategory, addCategory, updateCategory, deleteCategory , loadCategoryDetails
} from '../controllers/admin/adminCategoryOps.js'

import {loadPendingRequest, deleteCourse, loadCourses, assignCategory, approveOrRejectCourse, allowOrSuspendCourse
} from '../controllers/course/adminOps.js'

import {refreshAccessToken, verifyAccessToken,verifyRefreshToken} from '../utils/verifyToken.js'
import { loadNotifications, readNotifications } from '../controllers/notificationController.js'
import { validateForm } from '../middleware/validation.js'
import { strictLimiter, authLimiter, standardLimiter, readLimiter } from '../middleware/rateLimiting.js'
import { createCoupon, deleteCoupon, loadCoupons, updateCoupons } from '../controllers/admin/adminCouponOps.js'
import { loadOrderDetails } from '../controllers/order/adminOrderOps.js'
import { adminWithdrawAmount, approveOrRejectWithdrawRequest, loadWalletDetails, loadWithdrawRequests } from '../controllers/transactions.js'
import { loadTransactionList } from '../controllers/admin/transactions.js'
import { bestSellingCategory, bestSellingCourse, revenueChartAnalysis, dashboardDetails } from '../controllers/analytics/admin.js'

const router = express.Router()

// ==================== AUTH ROUTES ====================

/**
 * @swagger
 * /api/admin/signup:
 *   post:
 *     summary: Register admin (restricted)
 *     description: Creates a new admin account
 *     tags: [Auth - Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Admin registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/signup', authLimiter, validateForm('admin','register'), registerAdmin);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticates admin and sets JWT tokens in HTTP-only cookies
 *     tags: [Auth - Admin]
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
router.post('/login', strictLimiter, validateForm('admin','login'), loginAdmin);

/**
 * @swagger
 * /api/admin/logout:
 *   delete:
 *     summary: Admin logout
 *     tags: [Auth - Admin]
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
router.delete('/logout', logoutAdmin)

/**
 * @swagger
 * /api/admin/refresh-token:
 *   patch:
 *     summary: Refresh access token
 *     tags: [Auth - Admin]
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.patch('/refresh-token', verifyRefreshToken('Admin'), refreshAccessToken)

// ==================== ADMIN PROFILE ====================

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Auth - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
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
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     profileImage:
 *                       type: string
 */
router.get('/profile', verifyAccessToken('admin'), readLimiter, loadProfile)

/**
 * @swagger
 * /api/admin/update-profile:
 *   post:
 *     summary: Update admin profile
 *     tags: [Auth - Admin]
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
router.post('/update-profile', validateForm('admin','profile'), verifyAccessToken('admin'), standardLimiter, updateProfile)

// ==================== USER MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/add-user:
 *   post:
 *     summary: Add new user
 *     tags: [Admin - Users]
 *     security:
 *       - cookieAuth: []
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
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/add-user', verifyAccessToken('admin'), standardLimiter, addUser)

/**
 * @swagger
 * /api/admin/users-details:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Admin - Users]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [newest, oldest, blocked, Not-blocked]
 *     responses:
 *       200:
 *         description: Users list
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/users-details', verifyAccessToken('admin'), readLimiter, loadUsers)

/**
 * @swagger
 * /api/admin/user-details/{id}:
 *   get:
 *     summary: Get specific user details
 *     tags: [Admin - Users]
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
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/user-details/:id', verifyAccessToken('admin'), readLimiter, loadUserDetails)

/**
 * @swagger
 * /api/admin/update-user-details/{id}:
 *   post:
 *     summary: Update user details
 *     tags: [Admin - Users]
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
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/update-user-details/:id', verifyAccessToken('admin'), standardLimiter, updateUserDetails)

/**
 * @swagger
 * /api/admin/toggle-user-block/{id}:
 *   patch:
 *     summary: Block/unblock user
 *     tags: [Admin - Users]
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
 *         description: User block status toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.patch('/toggle-user-block/:id', verifyAccessToken('admin'), standardLimiter, toggleUserBlock)

/**
 * @swagger
 * /api/admin/delete-user/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin - Users]
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
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/delete-user/:id', verifyAccessToken('admin'), standardLimiter, deleteUser)

// ==================== TUTOR MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/add-tutor:
 *   post:
 *     summary: Add new tutor
 *     tags: [Admin - Tutors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tutor created
 */
router.post('/add-tutor', verifyAccessToken('admin'), standardLimiter, addTutor)

/**
 * @swagger
 * /api/admin/tutors-details:
 *   get:
 *     summary: Get all tutors (paginated)
 *     tags: [Admin - Tutors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutors list
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
 *                     tutors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tutor'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/tutors-details', verifyAccessToken('admin'), readLimiter, loadTutors)

/**
 * @swagger
 * /api/admin/tutor-details/{id}:
 *   get:
 *     summary: Get specific tutor details
 *     tags: [Admin - Tutors]
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
 *         description: Tutor details
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
router.get('/tutor-details/:id', verifyAccessToken('admin'), readLimiter, loadTutorDetails)

/**
 * @swagger
 * /api/admin/update-tutor-details/{id}:
 *   post:
 *     summary: Update tutor details
 *     tags: [Admin - Tutors]
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
 *         description: Tutor updated
 */
router.post('/update-tutor-details/:id', verifyAccessToken('admin'), standardLimiter, updateTutorDetails)

/**
 * @swagger
 * /api/admin/toggle-tutor-block/{id}:
 *   patch:
 *     summary: Block/unblock tutor
 *     tags: [Admin - Tutors]
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
 *         description: Tutor block status toggled
 */
router.patch('/toggle-tutor-block/:id', verifyAccessToken('admin'), standardLimiter, toggleTutorBlock)

/**
 * @swagger
 * /api/admin/delete-tutor/{id}:
 *   delete:
 *     summary: Delete tutor
 *     tags: [Admin - Tutors]
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
 *         description: Tutor deleted
 */
router.delete('/delete-tutor/:id', verifyAccessToken('admin'), standardLimiter, deleteTutor)

/**
 * @swagger
 * /api/admin/verification-request:
 *   get:
 *     summary: Get tutor verification requests
 *     tags: [Admin - Tutors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Verification requests list
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
 *                       firstName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       expertise:
 *                         type: array
 *                         items:
 *                           type: string
 *                       verificationStatus:
 *                         type: string
 */
router.get('/verification-request', verifyAccessToken('admin'), readLimiter, loadRequests)

/**
 * @swagger
 * /api/admin/control-verification:
 *   post:
 *     summary: Approve or reject tutor verification
 *     tags: [Admin - Tutors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tutorId, action]
 *             properties:
 *               tutorId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification status updated
 */
router.post('/control-verification', verifyAccessToken('admin'), standardLimiter, approveOrRejectrequest)

// ==================== CATEGORY MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories (paginated)
 *     tags: [Admin - Categories]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [oldest, active, Not-Active]
 *     responses:
 *       200:
 *         description: Categories list
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 */
router.get('/categories', verifyAccessToken('admin'), readLimiter, loadCategory)

/**
 * @swagger
 * /api/admin/category:
 *   get:
 *     summary: Get specific category by name
 *     tags: [Admin - Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/category', verifyAccessToken('admin'), readLimiter, loadCategoryDetails)

/**
 * @swagger
 * /api/admin/add-category:
 *   post:
 *     summary: Add new category
 *     tags: [Admin - Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Web Development
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/add-category', verifyAccessToken('admin'), standardLimiter, addCategory)

/**
 * @swagger
 * /api/admin/update-category:
 *   post:
 *     summary: Update category
 *     tags: [Admin - Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/update-category', verifyAccessToken('admin'), standardLimiter, updateCategory)

/**
 * @swagger
 * /api/admin/delete-category/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Admin - Categories]
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
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/delete-category/:id', verifyAccessToken('admin'), standardLimiter, deleteCategory)

// ==================== COUPON MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/create-coupon:
 *   post:
 *     summary: Create coupon
 *     tags: [Admin - Coupons]
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
 *                   code:
 *                     type: string
 *                     example: SAVE20
 *                   discountType:
 *                     type: string
 *                     enum: [percentage, fixed]
 *                   discountValue:
 *                     type: number
 *                   minPurchaseAmount:
 *                     type: number
 *                   maxDiscount:
 *                     type: number
 *                   expiryDate:
 *                     type: string
 *                     format: date-time
 *                   usageLimit:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Coupon created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 */
router.post('/create-coupon', verifyAccessToken('admin'), standardLimiter, validateForm('admin','coupon'), createCoupon)

/**
 * @swagger
 * /api/admin/load-coupons:
 *   get:
 *     summary: Get all coupons (paginated)
 *     tags: [Admin - Coupons]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [oldest, active, Not-Active]
 *     responses:
 *       200:
 *         description: Coupons list
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
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/load-coupons', verifyAccessToken('admin'), readLimiter, loadCoupons)

/**
 * @swagger
 * /api/admin/update-coupon:
 *   post:
 *     summary: Update coupon
 *     tags: [Admin - Coupons]
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
 *                 $ref: '#/components/schemas/Coupon'
 *     responses:
 *       200:
 *         description: Coupon updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/update-coupon', verifyAccessToken('admin'), standardLimiter, updateCoupons)

/**
 * @swagger
 * /api/admin/delete-coupon/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Admin - Coupons]
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
 *         description: Coupon deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/delete-coupon/:id', verifyAccessToken('admin'), standardLimiter, deleteCoupon)

// ==================== COURSE MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/pending-request:
 *   get:
 *     summary: Get pending course approval requests
 *     tags: [Admin - Courses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pending course requests
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
router.get('/pending-request', verifyAccessToken('admin'), readLimiter, loadPendingRequest)

/**
 * @swagger
 * /api/admin/verify-course:
 *   post:
 *     summary: Approve or reject course
 *     tags: [Admin - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, action]
 *             properties:
 *               courseId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/verify-course', verifyAccessToken('admin'), standardLimiter, approveOrRejectCourse)

/**
 * @swagger
 * /api/admin/view-courses:
 *   get:
 *     summary: Get all courses (paginated)
 *     tags: [Admin - Courses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Courses list
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
router.get('/view-courses', verifyAccessToken('admin'), readLimiter, loadCourses)

/**
 * @swagger
 * /api/admin/assign-category:
 *   post:
 *     summary: Assign category to course
 *     tags: [Admin - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, categoryId]
 *             properties:
 *               courseId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category assigned
 */
router.post('/assign-category', verifyAccessToken('admin'), standardLimiter, assignCategory)

/**
 * @swagger
 * /api/admin/course-status:
 *   post:
 *     summary: Allow or suspend course
 *     tags: [Admin - Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, action]
 *             properties:
 *               courseId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [allow, suspend]
 *     responses:
 *       200:
 *         description: Course status changed
 */
router.post('/course-status', verifyAccessToken('admin'), standardLimiter, allowOrSuspendCourse);

/**
 * @swagger
 * /api/admin/delete-course/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Admin - Courses]
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
 */
router.delete('/delete-course/:id', verifyAccessToken('admin'), standardLimiter, deleteCourse)

// ==================== NOTIFICATIONS ====================

/**
 * @swagger
 * /api/admin/load-notifications:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Admin - Analytics]
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
router.get('/load-notifications', verifyAccessToken('admin'), readLimiter, loadNotifications('admin'))

/**
 * @swagger
 * /api/admin/read-notifications:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.post('/read-notifications', verifyAccessToken('admin'), standardLimiter, readNotifications)

// ==================== ORDER MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (paginated)
 *     description: Returns paginated list of all orders with search, filter, and sort options
 *     tags: [Admin - Analytics]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by course name or user email
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [Pending, Success, Failed]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [Oldest, Price-high-to-low, Price-low-to-high]
 *     responses:
 *       200:
 *         description: Orders list
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 */
router.get('/orders', verifyAccessToken('admin'), readLimiter, loadOrderDetails);

// ==================== WALLET & TRANSACTIONS ====================

/**
 * @swagger
 * /api/admin/wallet:
 *   get:
 *     summary: Get admin wallet details
 *     description: Returns admin wallet balance, earnings, withdrawals, and transaction history
 *     tags: [Admin - Analytics]
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
router.get('/wallet', verifyAccessToken('admin'), readLimiter, loadWalletDetails('Admin'))

/**
 * @swagger
 * /api/admin/wallet/withdraw:
 *   post:
 *     summary: Admin withdraw funds
 *     tags: [Admin - Analytics]
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
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds
 */
router.post('/wallet/withdraw', verifyAccessToken('admin'), standardLimiter, adminWithdrawAmount)

/**
 * @swagger
 * /api/admin/withdraw-request:
 *   get:
 *     summary: Get pending tutor withdrawal requests
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Withdrawal requests
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WithdrawalRequest'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/withdraw-request', verifyAccessToken('admin'), readLimiter, loadWithdrawRequests)

/**
 * @swagger
 * /api/admin/withdraw-request/approve-or-reject:
 *   patch:
 *     summary: Approve or reject withdrawal request
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, input]
 *             properties:
 *               id:
 *                 type: string
 *               input:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request processed
 */
router.patch('/withdraw-request/approve-or-reject', verifyAccessToken('admin'), standardLimiter, approveOrRejectWithdrawRequest)

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transactions list
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/transactions', verifyAccessToken('admin'), readLimiter, loadTransactionList)

// ==================== ANALYTICS ====================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard overview
 *     description: Returns key metrics for the admin dashboard
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardAnalytics'
 */
router.get('/dashboard', verifyAccessToken('admin'), readLimiter, dashboardDetails)

/**
 * @swagger
 * /api/admin/dashboard/best-selling-course:
 *   get:
 *     summary: Get best selling courses
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Best selling courses
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
 *                       title:
 *                         type: string
 *                       enrollmentCount:
 *                         type: integer
 */
router.get('/dashboard/best-selling-course', verifyAccessToken('admin'), readLimiter, bestSellingCourse)

/**
 * @swagger
 * /api/admin/dashboard/best-selling-category:
 *   get:
 *     summary: Get best selling categories
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Best selling categories
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
 *                       name:
 *                         type: string
 *                       enrollmentCount:
 *                         type: integer
 */
router.get('/dashboard/best-selling-category', verifyAccessToken('admin'), readLimiter, bestSellingCategory)

/**
 * @swagger
 * /api/admin/dashboard/revenue-chart-data:
 *   get:
 *     summary: Get revenue chart data
 *     tags: [Admin - Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Revenue chart data
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
 *                       date:
 *                         type: string
 *                       revenue:
 *                         type: number
 */
router.get('/dashboard/revenue-chart-data', verifyAccessToken('admin'), readLimiter, revenueChartAnalysis)

export default router