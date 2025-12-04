import Course from "../../model/course.js";
import Transaction from "../../model/transaction.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js"

// const courseDetails = async (courseId) => {
    
//     try {
//         const course = await Course.findById(courseId)

//         return {
//             id : course._id,
//             name : course.title,
//             description : course.description,
//             thumbnail : course.thumbnail,
//             price : 
//         }

//     } catch (error) {
//         throw error
//     }

// }

export const loadTransactionList = async (req,res) => {
    
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page-1) * limit;

        const transactions = await Transaction.find()
        .populate('source.userId', 'firstName email profileImage') 
        .populate('source.tutorId', 'firstName email profileImage')
        .populate('source.courseId', 'title price thumbnail description categoryName level duration totalEnrollment createdAt')
        .populate('orderId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt : -1 })
        .lean(); 

        const totalTransactions = await Transaction.countDocuments({ type: { $ne: 'admin_withdrawal' } });
        
        const responseData = transactions.map((transaction)=>{

            const type = transaction.type;

            const user = type === 'course_purchase' ?  transaction.source.userId : null

            const tutor = (type === 'course_purchase' || type === 'tutor_withdrawal') ? 
             transaction.source.tutorId : null;

            const courseDetails = type === 'course_purchase' ? transaction.source.courseId : null
            const orderDetails = type === 'course_purchase' ? transaction.orderId : null

            const hasCoupon = orderDetails?.couponCode ? true : false

            let users = [];

            if(transaction.type === 'course_purchase'){
                users.push(tutor);
                users.push(user);

            }else if(transaction.type === 'tutor_withdrawal'){
                users.push(tutor)
            }

            const course = courseDetails ? {
                id : courseDetails._id,
                name : courseDetails.title,
                description : courseDetails.description,
                thumbnail : courseDetails.thumbnail,
                price : orderDetails.price.finalPrice,
                originalPrice : orderDetails.price.originalPrice,
                category : courseDetails.categoryName,
                level : courseDetails.level,
                duration : courseDetails.duration,
                totalEnrollment : courseDetails.totalEnrollment,
                createdAt : courseDetails.createdAt
            } : null

            const order = orderDetails ? {
                orderId : orderDetails._id,
                razorpayId : orderDetails.paymentDetails.transactionId,
                date : orderDetails.createdAt,
                paymentMethod : 'RazorPay',
                originalPrice : orderDetails.price.originalPrice,
                finalPrice : orderDetails.price.finalPrice,
                couponApplied : hasCoupon,
                couponCode : hasCoupon ? `SAVE${courseDetails.discount}` : null,
                discountPercentage : courseDetails?.discount || 0,
                status : orderDetails.paymentStatus
            } : null

            return {
                id : transaction._id,
                date : transaction.createdAt,
                amount : type === 'course_purchase' ? transaction.amount.courseAmount : transaction.amount.tutorPayout,
                type : transaction.type,
                status : 'completed',
                users,
                course,
                order
            }

        }).filter(t=>!(t.type === 'admin_withdrawal'));

        return ResponseHandler.success(res,STRING_CONSTANTS.LOAD_TRANSACTION_SUCCESS, HttpStatus.OK,{
            transactions : responseData,
            total : totalTransactions,
            currentPage : page,
            totalPage : Math.ceil( totalTransactions / limit )
        })
        
        
    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}