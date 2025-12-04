import express from 'express'

import {registerUser,loginUser,logoutUser,forgotPassword,verifyResetLink,
    passportCallback, authFailure ,authLoad
} from '../controllers/user/userAuth.js'

import {loadProfile,updateProfile
} from '../controllers/user/userOps.js'

import {addToCart, enrollInCourse, getCartDetails, loadEnrolledCourses} from '../controllers/enrolledCourse/userOps.js'

import {verifyAccessToken,} from '../utils/verifyToken.js'
import { validateForm } from '../middleware/validation.js'

import { updateEmail, verifyEmail , isBlock, updatePassword, verifyOtpForPasswordChange, resendOtpForPasswordChange, softDeleteUser} from '../controllers/commonControllers.js';

import passport from 'passport'
import { loadNotifications, readNotifications } from '../controllers/notificationController.js'
import { applyCoupon, bookmarkCourse, fetchCurrentAppliedCoupon, getPricing, isBookMarked, loadBookmarkCourses, removeAppliedCoupon, removeBookmarkCourse } from '../controllers/course/userOps.js'
import { createOrder, failedPayment, verifyPayment } from '../controllers/order/userOrderOps.js'
import { changeLessonOrModuleStatus, courseDetails, isCourseEnrolled, loadSelectedLesson, progressStatus, resetCourseProgress, updateProgressTracker } from '../controllers/enrolledCourse/userLearningOps.js'
import { loadWalletDetails } from '../controllers/transactions.js'
import { loadCertificates } from '../controllers/course/certificate.js'


const router =  express.Router();

// Auth routes

router.post('/signup',validateForm('user','register'),registerUser)
router.post('/login',validateForm('user','login'),loginUser)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',verifyResetLink)
router.delete('/logout',logoutUser)

router.get('/google',passport.authenticate("google-user",{ scope: ["profile", "email"] }))

router.get('/auth-callback',passport.authenticate("google-user",{ session : false }),passportCallback);

router.get('/auth-failure',authFailure)

router.get('/auth-load',verifyAccessToken('user'),authLoad)

//isBlock

router.get('/isblocked',verifyAccessToken('user'),isBlock('user'))

// CRUD routes

router.get('/profile',verifyAccessToken('user'),loadProfile)
router.patch('/update-email',verifyAccessToken('user'),updateEmail('user'))
router.patch('/verify-email',verifyAccessToken('user'),verifyEmail('user'))
router.patch('/profile/update-password',verifyAccessToken('user'),updatePassword('user'))
router.patch('/profile/update-password/re-send-otp',verifyAccessToken('user'),resendOtpForPasswordChange('user'))
router.patch('/profile/update-password/verify-otp',verifyAccessToken('user'),verifyOtpForPasswordChange('user'))
router.post('/update-profile/:id',validateForm('user','profile'),verifyAccessToken('user'),updateProfile)
router.patch('/profile/deactivate-account',verifyAccessToken('user'),softDeleteUser('user'))

// course bookmark

router.post('/bookmark-course',verifyAccessToken('user'),bookmarkCourse)
router.get('/isBookmarked-course/:id',verifyAccessToken('user'),isBookMarked)
router.get('/bookmark-course',verifyAccessToken('user'),loadBookmarkCourses)
router.patch('/bookmark-course/:id',verifyAccessToken('user'),removeBookmarkCourse)

//cart managing

router.post('/cart',verifyAccessToken('user'),addToCart)
router.get('/cart/:id',verifyAccessToken('user'),getCartDetails)

// course enrollment 

router.post('/enroll-course',verifyAccessToken('user'),enrollInCourse)
router.get('/enrolled-courses',verifyAccessToken('user'),loadEnrolledCourses)

// notification

router.get('/load-notifications',verifyAccessToken('user'),loadNotifications('user'))
router.post('/read-notifications',verifyAccessToken('user'),readNotifications)

//pricing

router.get('/get-pricing/:id',verifyAccessToken('user'),getPricing)
router.get('/get-applied-coupon/:id',verifyAccessToken('user'),fetchCurrentAppliedCoupon)
router.post('/apply-coupon',verifyAccessToken('user'),applyCoupon)
router.delete('/remove-applied-coupon/:id',verifyAccessToken('user'),removeAppliedCoupon)

// order 

router.post('/create-order',verifyAccessToken('user'),createOrder)
router.post('/verify-payment',verifyAccessToken('user'),verifyPayment)
router.patch('/failed-payment/:id',verifyAccessToken('user'),failedPayment)

// learning progress

router.get('/check-enrollment/:id',verifyAccessToken('user'),isCourseEnrolled)
router.patch('/update-progress-tracker/:id',verifyAccessToken('user'),updateProgressTracker)
router.get('/enrolled-course/course-details/:id',verifyAccessToken('user'),courseDetails)
router.get('/enrolled-course/current-status/:id',verifyAccessToken('user'),progressStatus)
router.put('/enrolled-course/lesson-status',verifyAccessToken('user'),changeLessonOrModuleStatus)
router.get('/lesson',verifyAccessToken('user'),loadSelectedLesson)
router.put('/reset-progress/:id',verifyAccessToken('user'),resetCourseProgress)

// wallet

router.get('/wallet',verifyAccessToken('user'),loadWalletDetails('User'))

// Course certificates

router.get('/certificates',verifyAccessToken('user'),loadCertificates)


export default router