import mongoose from "mongoose";
import { nanoid } from "nanoid";

const couponSchema = mongoose.Schema({
     
    _id : { type : String, default : ()=>nanoid(12) },

    code : { type : String, required : true, unique : true, uppercase : true, trim : true },

    discountType : { type : String, enum : ['percentage','fixed'], required : true },

    discountValue : { type : Number, required : true },

    minPurchaseAmount : { type : Number, default : 0 },

    maxDiscount : { type : Number, default : 0 },

    expiryDate : { type : Date, required : true },

    usageLimit : { type : Number, default : 1 },

    usedBy : [ { _id : false , userId : { type : String, ref : 'User' } , usage : { type : Number, default : 0 }  } ],

    isActive : { type : Boolean, default : false },

},
{ timestamps: true });

const Coupon = mongoose.model('Coupon',couponSchema)

export default Coupon