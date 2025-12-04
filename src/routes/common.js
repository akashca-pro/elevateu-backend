import express from 'express'
const router = express.Router()
import {sendOtp, verifyOtp, loadCategories,
    loadCourseDetails, loadCourses, loadCourseTitles} from '../controllers/commonControllers.js'
import { bestSellingCategory, bestSellingCourse } from '../controllers/analytics/admin.js'

router.post('/generate-otp',sendOtp)
router.post('/verify-otp',verifyOtp)

router.get('/load-categories',loadCategories)

router.get('/courses',loadCourses)
router.get('/top-categories',bestSellingCategory)
router.get('/top-courses',bestSellingCourse)
router.get('/courses/:id',loadCourseDetails)
router.get('/course-titles',loadCourseTitles)



export default router