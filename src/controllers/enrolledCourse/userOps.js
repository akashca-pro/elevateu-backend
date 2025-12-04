import EnrolledCourse from "../../model/enrolledCourses.js";
import Course from "../../model/course.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";
import ResponseHandler from "../../utils/responseHandler.js";
import Order from "../../model/order.js";
import User from "../../model/user.js";
import { saveNotification, sendNotification } from "../../utils/LiveNotification.js";
import ProgressTracker from "../../model/progressTracker.js";
import { calculateLevelSize } from "./userLearningOps.js";
import Wallet from "../../model/wallet.js";
import Transaction from "../../model/transaction.js";
import 'dotenv/config'
import Tutor from "../../model/tutor.js";

// handle transaction and wallet update

const handleTransactionAndWalletUpdate = async ({
    orderDetails,
    course,
    userId,
    tutorId,
    adminId
}) => {
    try {

        const finalPrice = orderDetails.price.finalPrice;
    
        const tutorPayout = parseFloat((finalPrice * 0.8).toFixed(2));
        const adminPayout = parseFloat((finalPrice * 0.2).toFixed(2));

        // Transaction
        const transaction = await Transaction.create({
            type : 'course_purchase',
            source : {
                userId,
                courseId : course._id,
                tutorId,
                adminId
            },
            amount : {
                courseAmount : finalPrice,
                tutorPayout,
                adminPayout
            },
            orderId : orderDetails._id,
          })
    
        // create user transaction history
        const userTransaction = {
            transactionId : transaction._id,
            type: 'debit',
            amount: finalPrice,
            purpose: 'course_purchase',
            status: 'completed',
            courseId: course._id,
            description: `You purchased course ${course.title}`
        }

        // update user wallet
        await Wallet.updateOne(
            { userId, userModel : 'User' },
            {
                $push : { transactions : userTransaction }
            }
        );

        // create tutor transaction history
        const tutorTransaction = {
            transactionId : transaction._id,
            type: 'credit',
            amount: tutorPayout,
            platformFee : adminPayout,
            purpose: 'course_purchase',
            status: 'completed',
            courseId: course._id,
            description: `Earning from course: ${course.title}`
          };

        //update tutor wallet
        await Wallet.updateOne(
            { userId : tutorId, userModel : 'Tutor' },
            {
                $push : { transactions : tutorTransaction },
                $inc : { balance : tutorPayout, totalEarnings : tutorPayout }
            }
        )

        // create admin transaction history
        const adminTransaction = {
            transactionId : transaction._id,
            type: 'credit',
            amount: adminPayout,
            purpose: 'commission',
            status: 'completed',
            courseId: course._id,
            description: `Commission from course: ${course.title}`
          };

          // update admin wallet
          await Wallet.updateOne(
            { userId: adminId, userModel: 'Admin' },
            {
              $push: { transactions: adminTransaction },
              $inc: { balance: adminPayout, totalEarnings: adminPayout }
            }
          );


    } catch (error) {
        throw error;
    }
}

// add to cart

export const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const {courseId} = req.body;

        await User.findByIdAndUpdate(userId, { $set: { cart: courseId } });

        return ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

// retrieve from cart 

export const getCartDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.id

        const isAlreadyEnrolled = await EnrolledCourse.findOne({ userId, courseId })

        if(isAlreadyEnrolled)
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_ALREADY_ENROLLED, HttpStatus.BAD_REQUEST)

        const cartDetails = await User.findOne({ _id: userId, cart: { $ne: null } })
            .select("name firstName email phone profileImage _id ") 
            .populate({
                path: "cart", 
                populate : {
                    path : 'tutor',
                    select : 'firstName'
                }
            });

            if (!cartDetails || !cartDetails.cart) {
                return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);
            }
            
            const response = {
                user : {
                    _id : cartDetails._id,
                    email : cartDetails.email,
                    name : cartDetails.firstName,
                    phone : cartDetails.phone,
                    profileImage : cartDetails.profileImage
                },
                course : {
                    _id : cartDetails.cart._id,
                    title : cartDetails.cart.title,
                    tutor : cartDetails.cart.tutor.firstName,
                    duration : cartDetails.cart.duration,
                    rating : cartDetails.cart.rating,
                    description : cartDetails.cart.description,
                    thumbnail : cartDetails.cart.thumbnail,
                    hasCertification : cartDetails.cart.hasCertification,
                    modules : cartDetails.cart.modules.length,
                    lessons : cartDetails.cart.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0),
                    level : cartDetails.cart.level
                }

            }


        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK,response);

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

// enroll course

export const enrollInCourse = async (req,res) => {
    
    try {
        const { courseId } = req.body;
        const userId = req.user.id;
        const course  = await Course.findOne({_id : courseId , isPublished : true})
       
        if(!course) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);

        const tutorId = course.tutor;
        
        const alreadyEnrolled = await EnrolledCourse.findOne({user : userId , course : courseId})

        if(alreadyEnrolled) 
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_ALREADY_ENROLLED, HttpStatus.CONFLICT);

        const orderDetails = await Order.findOne({ userId, courseId })

        if(!orderDetails || orderDetails.paymentStatus !== 'success')
            return ResponseHandler.error(res, 'Payment is not done', HttpStatus.BAD_REQUEST);

        await handleTransactionAndWalletUpdate({
            orderDetails,
            adminId : process.env.ADMIN_ID,
            course,
            userId,
            tutorId,
        })

        // save enrollment

        await EnrolledCourse.create({
            userId,
            courseId,
            paymentDetails : {
                transactionId : orderDetails.paymentDetails.transactionId,
                amountPaid : orderDetails.price.finalPrice,
                orderId : orderDetails._id
            }
        })

        await Course.findByIdAndUpdate(courseId, { $inc : { totalEnrollment : 1 } })
        
        await Tutor.findByIdAndUpdate(
            tutorId,
            { $addToSet: { students: userId } }
        );

        // add enrolled course to user schema
        const user = await User.findByIdAndUpdate(userId,{ $addToSet : { enrolledCourses : courseId } ,
             $set : { cart : null } },{new : true});

        // start progress tracking

        const progressTrackerAlreadyExist = await ProgressTracker.findOne({ userId, courseId })

        if(progressTrackerAlreadyExist)
            return ResponseHandler.error(res, STRING_CONSTANTS.PROGRESS_TRACKER_ALREADY_EXIST,HttpStatus.CONFLICT);

        const modules = course.modules.map((module) => ({
            moduleId: module._id,
            moduleTitle : module.title,   
            lessons: module.lessons.map((lesson)=>({
                lessonId : lesson._id,
                lessonTitle : lesson.title,
                isCompleted : false,
                isAddon : false           
            })),   
            isCompleted: false,
            isAddon : false      
        }));

      const { currentLevel, cumulativeModules } = calculateLevelSize(modules)

        const level = {
            currentLevel , 
            cumulativeModules
        };

        await ProgressTracker.create({
            userId,
            courseId,
            modules,
            level,
            lastCourseUpdate : course.updatedAt
        })       

             const newNotification = await saveNotification(
                tutorId, 
                'Tutor', 
                'new_enrollment', 
                `A new student, ${user.firstName}, has enrolled in your course: ${course.title}.`
            );
            
        sendNotification(req,newNotification)

        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.CREATED);

    } catch (error) {
        console.log(STRING_CONSTANTS.CREATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.CREATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// load enrolled courses

export const loadEnrolledCourses = async (req,res) => {
    
    try {
        const userId = req.user.id
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        const {search, filter} = req.query

        let filterQuery = {};
        let sort = { createdAt: -1 }; // Default sorting (Newest first)

        if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
        }  

        if (search) {
            filterQuery.title =  { $regex: search, $options: "i" } 
        }   

        const user = await User.findById(userId).select('enrolledCourses -_id').lean() || []

        const enrollments = await Course.find({ _id : { $in : user.enrolledCourses } , ...filterQuery })
        .select('_id title thumbnail categoryName category tutor')
        .populate({
            path : 'tutor', select: 'firstName email'
        })
        .skip(skip)
        .limit(limit)
        .sort(sort)

        // console.log(enrollments)

        const otherDetails = await EnrolledCourse.find({userId}).select('courseId courseProgress isCompleted -_id').lean()
        
        const extraDetails = otherDetails.reduce((acc, { courseId, ...rest }) => { // progress and completion boolead
            acc[courseId] = rest;
            return acc;
          }, {});

          const totalCourse = await Course.countDocuments({ _id: { $in: user.enrolledCourses }, ...filterQuery });

        if(enrollments.length === 0) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        const finalData = {
            courses : enrollments,
            total: totalCourse, 
            currentPage: page,
            totalPages: Math.ceil(totalCourse / limit),
            extraDetails
        }
            
        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, finalData)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}
