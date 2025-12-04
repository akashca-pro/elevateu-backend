import mongoose from "mongoose";
import { nanoid } from "nanoid";

const appliedCouponSchema = new mongoose.Schema({
    _id : { type : String, default : ()=> nanoid(12) },
    userId: { type: String, ref: "User", required: true },
    courseId : {type : String, ref : 'Course', required : true},
    couponCode: { type: String, required: true },
    discount : { type : Number, required : true },
    discountType : {type : String},
    finalAmount : { type : Number, required : true },
    appliedAt: { type: Date, default: Date.now },
    isPaymentSuccessful: { type: Boolean, default: false },

},{ timestamps: true })

appliedCouponSchema.index({appliedAt : 1},{ expireAfterSeconds : 900 })

const AppliedCoupon = mongoose.model('AppliedCoupon',appliedCouponSchema)

export default AppliedCoupon