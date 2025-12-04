import express from 'express'

import {registerAdmin, loginAdmin, logoutAdmin, loadProfile, updateProfile
} from '../controllers/admin/adminAuth.js'   // Admin Auth

import {addUser,loadUsers,loadUserDetails,updateUserDetails,deleteUser,toggleUserBlock    
} from '../controllers/admin/adminUserOps.js' // Admin - User CRUD

import {addTutor,loadTutors,loadTutorDetails,updateTutorDetails,deleteTutor,
loadRequests,approveOrRejectrequest,toggleTutorBlock
} from '../controllers/admin/adminTutorOps.js' // Admin - Tutor CRUD

import {loadCategory, addCategory, updateCategory, deleteCategory , loadCategoryDetails
} from '../controllers/admin/adminCategoryOps.js' // Admin - category CRUD

import {loadPendingRequest, deleteCourse, loadCourses, assignCategory, approveOrRejectCourse, allowOrSuspendCourse
} from '../controllers/course/adminOps.js' // Admin manage course approval and course Manage

import {refreshAccessToken, verifyAccessToken,verifyRefreshToken} from '../utils/verifyToken.js'
import { loadNotifications, readNotifications } from '../controllers/notificationController.js'
import { validateForm } from '../middleware/validation.js'
import { createCoupon, deleteCoupon, loadCoupons, updateCoupons } from '../controllers/admin/adminCouponOps.js'
import { loadOrderDetails } from '../controllers/order/adminOrderOps.js'
import { adminWithdrawAmount, approveOrRejectWithdrawRequest, loadWalletDetails, loadWithdrawRequests } from '../controllers/transactions.js'
import { loadTransactionList } from '../controllers/admin/transactions.js'
import { bestSellingCategory, bestSellingCourse, revenueChartAnalysis, dashboardDetails } from '../controllers/analytics/admin.js'

const router = express.Router()

// Auth routes

router.post('/signup',validateForm('admim','register'),registerAdmin);
router.post('/login',validateForm('admin','login'),loginAdmin);
router.delete('/logout',logoutAdmin)
router.patch('/refresh-token',verifyRefreshToken('Admin'),refreshAccessToken)

// Admin profile CRUD

router.get('/profile',verifyAccessToken('admin'),loadProfile)
router.post('/update-profile',validateForm('admin','profile'),verifyAccessToken('admin'),updateProfile)

//  Admin - Users CRUD

router.post('/add-user',verifyAccessToken('admin'),addUser)
router.get('/users-details',verifyAccessToken('admin'),loadUsers)
router.get('/user-details/:id',verifyAccessToken('admin'),loadUserDetails)
router.post('/update-user-details/:id',verifyAccessToken('admin'),updateUserDetails)
router.patch('/toggle-user-block/:id',verifyAccessToken('admin'),toggleUserBlock)
router.delete('/delete-user/:id',verifyAccessToken('admin'),deleteUser)

// Admin - Tutor CRUD

router.post('/add-tutor',verifyAccessToken('admin'),addTutor)
router.get('/tutors-details',verifyAccessToken('admin'),loadTutors)
router.get('/tutor-details/:id',verifyAccessToken('admin'),loadTutorDetails)
router.post('/update-tutor-details/:id',verifyAccessToken('admin'),updateTutorDetails)
router.patch('/toggle-tutor-block/:id',verifyAccessToken('admin'),toggleTutorBlock)
router.delete('/delete-tutor/:id',verifyAccessToken('admin'),deleteTutor)

// notification from tutor verification request

router.get('/verification-request',verifyAccessToken('admin'),loadRequests)
router.post('/control-verification',verifyAccessToken('admin'),approveOrRejectrequest)

// category CRUD

router.get('/categories',verifyAccessToken('admin'),loadCategory)
router.get('/category',verifyAccessToken('admin'),loadCategoryDetails)
router.post('/add-category',verifyAccessToken('admin'),addCategory)
router.post('/update-category',verifyAccessToken('admin'),updateCategory)
router.delete('/delete-category/:id',verifyAccessToken('admin'),deleteCategory)

// coupon CRUD

router.post('/create-coupon',verifyAccessToken('admin'),validateForm('admin','coupon'),createCoupon)
router.get('/load-coupons',verifyAccessToken('admin'),loadCoupons)
router.post('/update-coupon',verifyAccessToken('admin'),updateCoupons)
router.delete('/delete-coupon/:id',verifyAccessToken('admin'),deleteCoupon)

//course publish request manage

router.get('/pending-request',verifyAccessToken('admin'),loadPendingRequest)
router.post('/verify-course',verifyAccessToken('admin'),approveOrRejectCourse)

// course manage

router.get('/view-courses',verifyAccessToken('admin'),loadCourses)
router.post('/assign-category',verifyAccessToken('admin'),assignCategory)
router.post('/course-status',verifyAccessToken('admin'),allowOrSuspendCourse);
router.delete('/delete-course/:id',verifyAccessToken('admin'),deleteCourse)

// notification

router.get('/load-notifications',verifyAccessToken('admin'),loadNotifications('admin'))
router.post('/read-notifications',verifyAccessToken('admin'),readNotifications)

// order manage

router.get('/orders',verifyAccessToken('admin'),loadOrderDetails);

// wallet

router.get('/wallet',verifyAccessToken('admin'),loadWalletDetails('Admin'))
router.post('/wallet/withdraw',verifyAccessToken('admin'),adminWithdrawAmount)

// withdraw request

router.get('/withdraw-request',verifyAccessToken('admin'),loadWithdrawRequests)
router.patch('/withdraw-request/approve-or-reject',verifyAccessToken('admin'),approveOrRejectWithdrawRequest)

// transactions

router.get('/transactions',verifyAccessToken('admin'),loadTransactionList)

// analytics

router.get('/dashboard',verifyAccessToken('admin'),dashboardDetails)
router.get('/dashboard/best-selling-course',verifyAccessToken('admin'),bestSellingCourse)
router.get('/dashboard/best-selling-category',verifyAccessToken('admin'),bestSellingCategory)
router.get('/dashboard/revenue-chart-data',verifyAccessToken('admin'),revenueChartAnalysis)

export default router