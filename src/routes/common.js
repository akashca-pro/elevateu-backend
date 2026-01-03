import express from 'express'
const router = express.Router()
import {sendOtp, verifyOtp, loadCategories,
    loadCourseDetails, loadCourses, loadCourseTitles} from '../controllers/commonControllers.js'
import { bestSellingCategory, bestSellingCourse } from '../controllers/analytics/admin.js'
import { publicLimiter, strictLimiter } from '../middleware/rateLimiting.js'

/**
 * @swagger
 * /api/generate-otp:
 *   post:
 *     summary: Generate OTP for email verification
 *     description: Sends a 6-digit OTP to the specified email for verification purposes (registration, password reset, etc.)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstName, role, otpType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               firstName:
 *                 type: string
 *                 example: John
 *               role:
 *                 type: string
 *                 enum: [user, tutor]
 *                 example: user
 *               otpType:
 *                 type: string
 *                 enum: [signup, reset, email-verify]
 *                 example: signup
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: OTP sent successfully
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/generate-otp', strictLimiter, sendOtp)

/**
 * @swagger
 * /api/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verifies the 6-digit OTP sent to user's email
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, role, otpType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [user, tutor]
 *               otpType:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: Verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/verify-otp', strictLimiter, verifyOtp)

/**
 * @swagger
 * /api/load-categories:
 *   get:
 *     summary: Get all active categories
 *     description: Returns a list of all active course categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/load-categories', publicLimiter, loadCategories)

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get paginated list of published courses
 *     description: Returns a filtered, paginated list of all published courses with search, category, rating, level, and price filters
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 9
 *         description: Number of items per page
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: JSON encoded filter object with search, category, rating, levels, priceRange properties
 *         example: '{"search":"web","category":"abc123","rating":4}'
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CourseBasic'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 6
 */
router.get('/courses', publicLimiter, loadCourses)

/**
 * @swagger
 * /api/top-categories:
 *   get:
 *     summary: Get best selling categories
 *     description: Returns categories sorted by number of course enrollments
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Top categories retrieved successfully
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
router.get('/top-categories', publicLimiter, bestSellingCategory)

/**
 * @swagger
 * /api/top-courses:
 *   get:
 *     summary: Get best selling courses
 *     description: Returns courses sorted by enrollment count
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Top courses retrieved successfully
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
router.get('/top-courses', publicLimiter, bestSellingCourse)

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course details by ID
 *     description: Returns detailed information about a specific course including modules and lessons
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *         example: abc123def456
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/courses/:id', publicLimiter, loadCourseDetails)

/**
 * @swagger
 * /api/course-titles:
 *   get:
 *     summary: Search course titles for autocomplete
 *     description: Returns matching course titles for search autocomplete functionality
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for course titles
 *         example: javascript
 *     responses:
 *       200:
 *         description: Course titles retrieved successfully
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
 */
router.get('/course-titles', publicLimiter, loadCourseTitles)

export default router