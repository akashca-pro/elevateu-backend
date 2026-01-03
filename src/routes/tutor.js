import express from 'express'

import {registerTutor, loginTutor, forgotPassword, verifyResetLink, logoutTutor ,
    passportCallback,authFailure,authLoad, isTutorVerified
} from '../controllers/tutor/tutorAuth.js'

import {loadProfile,updateProfile,requestVerification
} from '../controllers/tutor/tutorOps.js'

import { verifyAccessToken} from '../utils/verifyToken.js'
import {otpLimiter, loginLimiter} from '../middleware/rateLimiting.js';
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

// Auth routes

router.post('/signup',validateForm('tutor','register'),registerTutor)
router.post('/login', loginLimiter, validateForm('tutor','login'),loginTutor)
router.post('/forgot-password',otpLimiter,forgotPassword)
router.post('/reset-password',verifyResetLink)
router.delete('/logout',logoutTutor)

router.get('/google',passport.authenticate('google-tutor',{ scope: ["profile", "email"] }))


router.get('/auth-callback',passport.authenticate('google-tutor',{ session : false , 
    failureRedirect : '/auth-failure' }),passportCallback);

router.get('/auth-failure',authFailure)

router.get('/auth-load',verifyAccessToken('tutor'),authLoad)

//Is Verified
router.get('/is-verified',verifyAccessToken('tutor'),isTutorVerified)

//Is Blocked

router.get('/isblocked',verifyAccessToken('tutor'),isBlock('tutor'))

// CRUD routes

router.get('/profile',verifyAccessToken('tutor'),loadProfile)
router.patch('/update-email',verifyAccessToken('tutor'),updateEmail('tutor'))
router.patch('/verify-email',verifyAccessToken('tutor'),verifyEmail('tutor'))
router.patch('/profile/update-password',verifyAccessToken('tutor'),updatePassword('tutor'))
router.patch('/profile/update-password/re-send-otp',verifyAccessToken('tutor'),resendOtpForPasswordChange('tutor'))
router.patch('/profile/update-password/verify-otp',verifyAccessToken('tutor'),verifyOtpForPasswordChange('tutor'))
router.post('/update-profile',verifyAccessToken('tutor'),validateForm('tutor','profile'),updateProfile)
router.patch('/profile/deactivate-account',verifyAccessToken('tutor'),softDeleteUser('tutor'))

// request verification from admin

router.patch('/request-verification/:id',verifyAccessToken('tutor'),requestVerification)

// course manage

router.post('/create-course',verifyAccessToken('tutor'),createCourse)
router.get('/courses',verifyAccessToken('tutor'),loadCourses)
router.get('/view-course/:id',verifyAccessToken('tutor'),courseDetails)
router.post('/update-course',verifyAccessToken('tutor'),updateCourse)
router.post('/publish-course',verifyAccessToken('tutor'),validateForm('tutor','course'),requestPublish)
router.delete('/delete-course/:id',verifyAccessToken('tutor'),deleteCourse)
router.get('/check-title',verifyAccessToken('tutor'),courseTitleExist)

// notification

router.get('/load-notifications',verifyAccessToken('tutor'),loadNotifications('tutor'))
router.post('/read-notifications',verifyAccessToken('tutor'),readNotifications)

// wallet 

router.get('/wallet',verifyAccessToken('tutor'),loadWalletDetails('Tutor'))

// bank account

router.get('/bank-details',verifyAccessToken('tutor'),loadExistingBankDetails)
router.post('/bank-details',verifyAccessToken('tutor'),addBankAccountDetails)
router.post('/withdrawal-request',verifyAccessToken('tutor'),intiateWithdrawalRequest)
router.get('/withdrawal-request',verifyAccessToken('tutor'),loadWithdrawalRequest)

export default router