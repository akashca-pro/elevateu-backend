import mongoose from "mongoose";
import { nanoid } from "nanoid";

const withdrawalRequestSchema = new mongoose.Schema({

    _id : { type : String, default : ()=>nanoid(12) },
    userId : { type : String, refPath : 'userRole', required : true },
    userName : { type : String, required : true },
    userModel : { type : String, enum : ['User','Tutor'], required : true },
    amount : { type : Number, required : true },
    paymentMethod : { type : String, required : true, enum : ['gpay','bank'] },
    email : { type : String, required : true },
    bankDetails : {
        accountNumber : { type : String },
        ifsc : { type : String },
        bankName : { type : String },
        holderName : { type : String}
    },
    status : { type : String, enum : ['pending','processing','completed','rejected'], default : 'pending' },
    adminNote : { type : String }
},{timestamps : true})

withdrawalRequestSchema.pre("validate", function (next) {
    if (this.paymentMethod === "bank") {
      if (
        !this.bankDetails ||
        !this.bankDetails.accountNumber ||
        !this.bankDetails.ifsc ||
        !this.bankDetails.bankName ||
        !this.bankDetails.holderName
      ) {
        return next(new Error("All bank details are required when payment method is bank."))
      }
    }
    next()
})

const WithdrawalRequest = mongoose.model('WithdrawalRequest',withdrawalRequestSchema)

export default WithdrawalRequest