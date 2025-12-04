import AppliedCoupon from "../../model/AppliedCoupons.js";
import Bookmark from "../../model/bookmark.js";
import Coupon from "../../model/coupon.js";
import Course from "../../model/course.js"
import Order from "../../model/order.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";

const calculateDiscount = (coupon,total) => {
    let discount;
    if (coupon.discountType === 'percentage') {
       
        const calculatedDiscount = total * (coupon.discountValue / 100);
        
        discount = coupon.maxDiscount > 0 ? Math.min(calculatedDiscount, coupon.maxDiscount) : calculatedDiscount;
    } else {
        discount = Math.min(coupon.discountValue, total);
    }

    return parseFloat(discount.toFixed(2));
}

export const getPricingDetails = (originalPrice, discount) => {
    const GST_RATE = 0.18; // 18% GST

    const subtotal = originalPrice;
    const courseDiscount = subtotal * (discount/ 100);
    const priceAfterDiscounts = subtotal - courseDiscount;
    const gstAmount = priceAfterDiscounts * GST_RATE;
    const total = priceAfterDiscounts + gstAmount;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(courseDiscount.toFixed(2)),
        priceAfterDiscounts: parseFloat(priceAfterDiscounts.toFixed(2)),
        gst: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
    };
};

// load pricing to checkout

export const getPricing = async (req,res) => {
    
    try {
        const courseId = req.params.id
        const courseDetails = await Course.findById(courseId);

        if(!courseDetails)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        const pricing = getPricingDetails(courseDetails.price, courseDetails.discount);

        return ResponseHandler.success(res, STRING_CONSTANTS.PRICING_SUCCESS,HttpStatus.OK,pricing)
        

    } catch (error) {
        console.log(STRING_CONSTANTS.PRICING_FAILED,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// apply coupon

export const applyCoupon = async (req,res) => {
    
    try {
        const userId = req.user.id
        const { courseId, couponCode,  } = req.body

        if (!courseId || !couponCode) {
            return ResponseHandler.error(res, 'Invalid request data', HttpStatus.BAD_REQUEST);
        }

        const coupon = await Coupon.findOne({ code : couponCode })
        const course = await Course.findById(courseId)

        const pricing = getPricingDetails(course.price, course.discount)

        // Check if coupon exists and is active
        if (!coupon || !coupon.isActive) {
            return ResponseHandler.error(res, 'Invalid coupon code', HttpStatus.BAD_REQUEST);
        }

        // Check expiration
        const currentDate = new Date();
        if (new Date(coupon.expiryDate) < currentDate) {
            return ResponseHandler.error(res, 'Coupon expired', HttpStatus.BAD_REQUEST);
        }

        // Check minimum purchase amount
        if (pricing.total < coupon.minPurchaseAmount) {
            return ResponseHandler.error(
                res, 
                `Minimum purchase of ${coupon.minPurchaseAmount} is required to apply this coupon`, 
                HttpStatus.BAD_REQUEST
            );
        }


        // Check if coupon already applied in session
        const alreadyApplied = await AppliedCoupon.findOne({ 
            userId, 
            courseId,
            couponCode: coupon.code,
            isPaymentSuccessful: false 
        });

        if (alreadyApplied) {
            return ResponseHandler.error(res, 'Coupon already applied to this order', HttpStatus.BAD_REQUEST);
        }

        // Check usage limit per user
        const userUsage = coupon.usedBy.find((entry) => entry.userId === userId);
        if (userUsage && userUsage.usage >= coupon.usageLimit) {
            return ResponseHandler.error(res, 'You have reached the usage limit for this coupon', HttpStatus.BAD_REQUEST);
        }
        
        // Calculate discount
        const discount = calculateDiscount(coupon,pricing.total)

        const appliedCoupon = await AppliedCoupon.create({
            userId,
            courseId,
            couponCode: coupon.code,
            discount,
            discountType : coupon.discountType,
            finalAmount : parseFloat((pricing.total - discount).toFixed(2))
        });

        return ResponseHandler.success(res, `${coupon.code} coupon applied successfully `,HttpStatus.OK,{
            couponCode: coupon.code,
            discount,
            finalAmount: parseFloat((pricing.total - discount).toFixed(2)),
            appliedCoupon : appliedCoupon._id
        })
        
    } catch (error) {
        console.log('Coupon Apply Failed',error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// fetch current applied coupon

export const fetchCurrentAppliedCoupon = async (req,res) => {
    try {
  
        const userId = req.user.id;

        const courseId = req.params.id;

        const order = await Order.findOne({ userId , courseId });

        const appliedCoupon = await AppliedCoupon.findOne({ userId , courseId })

        if(appliedCoupon){
            return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS,HttpStatus.OK,{
                couponCode: appliedCoupon.couponCode,
                discount : appliedCoupon.discount,
                finalAmount : appliedCoupon.finalAmount,
            })
        } 

        if(order && order.price.couponCode){
            return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS,HttpStatus.OK,{
                couponCode : order.price.couponCode,
                discount : order.price.couponDiscount,
                finalAmount : order.price.finalPrice,
            })
        }

        return ResponseHandler.success(res,STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.NO_CONTENT,null)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// remove applied coupon

export const removeAppliedCoupon = async (req,res) => {
    
    try {
       
        const courseId = req.params.id;
        const userId = req.user.id;

        const course = await Course.findById(courseId)

        const appliedCoupon = await AppliedCoupon.findOne({ userId, courseId })
        
        const order = await Order.findOne({ userId, courseId })

        if(!appliedCoupon && !order?.price.couponCode){
            return ResponseHandler.error(res,STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST)
        }

        if(order && order.price.couponCode){
            order.price.couponCode = undefined;
            order.price.couponDiscount = undefined;
            order.price.discountType = undefined;

            const { total, discount } = getPricingDetails(course.price, course.discount)
            
            order.price.finalPrice = total;
            order.price.courseDiscount = discount;

            await order.save()
        }
        
        if(appliedCoupon){
            await AppliedCoupon.findOneAndDelete({ userId, courseId })
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// bookmark a course

export const bookmarkCourse = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const {courseId} = req.body;

        const bookmarkCourse = await Bookmark.findOne({ userId , courseIdArray : courseId });

        if(bookmarkCourse)
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);

        await Bookmark.findOneAndUpdate(
            { userId }, 
            { $addToSet: { courseIdArray: courseId } },
            { new: true, upsert: true }
        );

        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.CREATION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// check a course is bookmarked

export const isBookMarked = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;
        const isBookMarked = await Bookmark.findOne({ userId, courseIdArray : { $in : courseId } });

        if(isBookMarked)
            return ResponseHandler.success(res, STRING_CONSTANTS.SUCCESS, HttpStatus.OK);

        return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

    } catch (error) {
        console.log(STRING_CONSTANTS.DATA_NOT_FOUND,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// load all bookmark courses

export const loadBookmarkCourses = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page-1) * limit;
       
        const {search, filter} = req.query

        let filterQuery = { isPublished : true };
        let sort = { createdAt: -1 }; // Default sorting (Newest first)

        if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
        }  

        if (search) {
            filterQuery.title =  { $regex: search, $options: "i" } 
        }   

          const bookmarkedCourses = await Bookmark.find({ userId }).select("courseIdArray -_id");
          const courseIds = bookmarkedCourses.flatMap(bookmark => bookmark.courseIdArray);
  

        if(courseIds.length === 0){
            return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS,HttpStatus.NO_CONTENT);
        }

        const totalCourses = await Course.countDocuments({ _id: { $in: courseIds }, ...filterQuery })
        
        const courses = await Course.find({ _id: { $in: courseIds }, ...filterQuery })
        .select(`title thumbnail level isFree price discount 
            tutor rating totalEnrollment duration category categoryName`)
        .populate({
                path : 'tutor',
                select : 'firstName profileImage '
            })
        .skip(skip)
        .limit(limit)
        .sort(sort);


        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, {
            courses,
            total: totalCourses, 
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit)
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// remove bookmark 

export const removeBookmarkCourse = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        const bookmark = await Bookmark.findOne({ userId, courseIdArray : { $in : courseId } })

        if(!bookmark)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        await Bookmark.findOneAndUpdate(
            { userId }, 
            { $pull: { courseIdArray: courseId } });

        return ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS,HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}