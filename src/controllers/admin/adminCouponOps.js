import Coupon from "../../model/coupon.js"
import ResponseHandler from "../../utils/responseHandler.js"
import HttpStatus from "../../utils/statusCodes.js"
import { STRING_CONSTANTS } from "../../utils/stringConstants.js"


export const createCoupon = async (req,res) => {
    
    try {
        const { formData } = req.body
        
        const alreadyExist = await Coupon.findOne({ code  : formData.code })

        if(alreadyExist)
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT)

        await Coupon.create({ 
            ...formData
         })

        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.OK)

    } catch (error) {  
        console.log(STRING_CONSTANTS.CREATION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

export const loadCoupons = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        const {search, filter} = req.query

        let sort = { createdAt: -1 }; // Default sorting (Newest first)
        let filterQuery = {}; 

            // Handle filter conditions
            if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
            } else if (filter === "active") {
            filterQuery.isActive = true;
            } else if (filter === "Not-Active") {
            filterQuery.isActive = false;
            }

                if (search) {
                    filterQuery.code = { $regex : search.toUpperCase() , $options : "i"  }                 
                }      
        
        const coupons = await Coupon.find(filterQuery)
        .skip(skip)
        .limit(limit)
        .sort(sort)

        const totalCoupons = await Coupon.countDocuments(filterQuery)

        if(!coupons || coupons.length === 0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK,{
            coupons: coupons,
            total: totalCoupons, 
            currentPage: page,
            totalPages: Math.ceil(totalCoupons / limit),
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR,error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

export const updateCoupons = async (req,res) => {
    
    try {
        const { formData } = req.body;

        const coupon = await Coupon.findById(formData._id)

        if(!coupon)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.NOT_FOUND);

        Object.assign(coupon, formData)

        await coupon.save()
        
        return ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

export const deleteCoupon = async (req,res) => {
    
    try {
        const couponId = req.params.id

        const exist = await Coupon.findById(couponId)

        if(!exist)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        await Coupon.findByIdAndDelete(couponId)

        return ResponseHandler.success(res, STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR,error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}


