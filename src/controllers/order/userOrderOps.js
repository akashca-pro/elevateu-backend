import AppliedCoupon from "../../model/AppliedCoupons.js";
import Coupon from "../../model/coupon.js";
import Course from "../../model/course.js";
import EnrolledCourse from "../../model/enrolledCourses.js";
import Order from "../../model/order.js";
import { generateSignature, razorpayOrder } from "../../utils/razorPay.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";
import { getPricingDetails } from "../course/userOps.js";

const calculateFinalPrice = (course, appliedCoupon) => {
    let originalPrice = course.price;
    let courseDiscount = (originalPrice * course.discount) / 100; // Convert percentage to amount
    let couponDiscount = 0;

    if (appliedCoupon) {
        if (appliedCoupon.discountType === "percentage") {
            couponDiscount = ((originalPrice - courseDiscount) * appliedCoupon.discount) / 100;
        } else if (appliedCoupon.discountType === "fixed") {
            couponDiscount = appliedCoupon.discount;
        }
    }

    let discountedPrice = originalPrice - courseDiscount - couponDiscount;
    
    // Include GST (18%)
    let gstAmount = discountedPrice * (18 / 100);  
    let finalPrice = discountedPrice + gstAmount;
    
    finalPrice = Math.max(finalPrice, 0).toFixed(2); 

    return { finalPrice, courseDiscount, couponDiscount, gstAmount };
};

export const createOrder = async (req,res) => {
    
    try {
        const { courseId, userData } = req.body
        
        if(!courseId || !userData )
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const isAlreadyEnrolled = await EnrolledCourse.findOne({ userId : userData._id , courseId})

        if(isAlreadyEnrolled)
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_ALREADY_ENROLLED, HttpStatus.BAD_REQUEST)
        
        const course = await Course.findById(courseId);
        
        if(!course) 
            return ResponseHandler.error(res, 'Course not found', HttpStatus.NOT_FOUND);
        
        const appliedCoupon = await AppliedCoupon.findOne({ userId : userData._id , courseId : courseId})
        
        const { total } = getPricingDetails(course.price, course.discount);

        const existOrder = await Order.findOne({ userId : userData._id , courseId})
        if(existOrder){
            
            if(appliedCoupon){
    
                const { courseDiscount } = calculateFinalPrice(course, appliedCoupon);

                const razorpayOrderDetails = await razorpayOrder(appliedCoupon.finalAmount);
                
                existOrder.price = {
                    originalPrice: course.price, 
                    courseDiscount, 
                    couponCode: appliedCoupon.couponCode ,
                    discountType: appliedCoupon.discountType ,
                    couponDiscount: appliedCoupon.discount ,
                    finalPrice :appliedCoupon.finalAmount
                };

                existOrder.paymentDetails.orderId = razorpayOrderDetails.id

                await existOrder.save()

                return ResponseHandler.success(res,'Order already exist',HttpStatus.OK,existOrder);
            }

  
            const { finalPrice, courseDiscount } = calculateFinalPrice(course, appliedCoupon)

            const razorpayOrderDetails = await razorpayOrder(finalPrice);

            existOrder.price = {
                originalPrice: course.price, 
                courseDiscount, 
                couponCode: undefined,
                discountType: undefined ,
                couponDiscount: undefined ,
                finalPrice
            };

            existOrder.paymentDetails.orderId = razorpayOrderDetails.id;

            await existOrder.save()

            return ResponseHandler.success(res,'Order already exist',HttpStatus.OK,existOrder);
       
        }

        const { finalPrice, courseDiscount } = calculateFinalPrice(course, appliedCoupon)

        const razorpayOrderDetails = await razorpayOrder(appliedCoupon ? appliedCoupon.finalAmount : finalPrice);

        const order = await Order.create({
            userId : userData._id,
            courseId,
            categoryId : course.category,
            userData : {
                name : userData.name,
                email : userData.email,
            },
            price : {
                originalPrice : course.price,
                courseDiscount,
                couponCode : appliedCoupon ? appliedCoupon.couponCode : undefined,
                discountType : appliedCoupon ? appliedCoupon.discountType : undefined,
                couponDiscount : appliedCoupon ? appliedCoupon.discount : undefined,
                finalPrice : appliedCoupon ? appliedCoupon.finalAmount : finalPrice
            },
            paymentStatus : 'pending',
            paymentDetails : {
                orderId : razorpayOrderDetails.id,
            }
        })
        
        return ResponseHandler.success(res,STRING_CONSTANTS.CREATION_SUCCESS,HttpStatus.OK,order)

    } catch (error) {
        console.log(error);
        return ResponseHandler.error(res,STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

export const verifyPayment = async (req,res) => {
    
    try {
        const userId = req.user.id;

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

        const order = await Order.findOne({ "paymentDetails.orderId": razorpay_order_id });

        if(!order)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.BAD_REQUEST);

        const generatedSignature = generateSignature(razorpay_order_id, razorpay_payment_id);

        if (generatedSignature !== razorpay_signature) {
            order.paymentStatus = "failed";
            await order.save();
            return ResponseHandler.error(res, STRING_CONSTANTS.PAYMENT_FAILED, HttpStatus.BAD_REQUEST)
        }

        order.paymentStatus = 'success';
        order.paymentDetails.transactionId = razorpay_payment_id;

        if (order.price.couponCode) {
            const coupon = await Coupon.findOne({ code: order.price.couponCode });
        
            if (coupon) {
                const userIndex = coupon.usedBy.findIndex(entry => entry.userId === userId);
        
                if (userIndex !== -1) {
                    // User exists in the usedBy array
                    if (coupon.usedBy[userIndex].usage < coupon.usageLimit) {
                        coupon.usedBy[userIndex].usage += 1;
                    }
                } else {
                    coupon.usedBy = [
                        ...coupon.usedBy,
                        { userId: userId.toString(), usage: 1 }
                    ];
                }
        
                await coupon.save();
            }
        }

        await order.save();

        return ResponseHandler.success(res, STRING_CONSTANTS.PAYMENT_SUCCESS,HttpStatus.OK,{
            orderId : order._id,
            transactionId : order.paymentDetails.transactionId,
            amountPaid : order.price.finalPrice
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.PAYMENT_FAILED,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

export const failedPayment = async (req,res) => {
    
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if(!order)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);

        await Order.findByIdAndUpdate(orderId, { $set : { paymentStatus : 'failed' } });

        return ResponseHandler.success(res, STRING_CONSTANTS.SUCCESS, HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.PAYMENT_FAILED, error);
        return ResponseHandler.success(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}