import mongoose from "mongoose";
import { nanoid } from "nanoid";

const transactionSchema = new mongoose.Schema(
    {
      _id : { type : String, required : true },  
      type: {
        type: String,
        enum: ['debit', 'credit'],
        required: function () {
          return this.amount != null;
        },
      },
      transactionId : {
        type : String,
        required : true
      },
      amount: {
        type: Number,
        required: function () {
          return this.type != null;
        },
      },
      platformFee : { 
        type : Number,
       },
      purpose: {
        type: String,
        enum: ['course_purchase', 'withdrawal', 'commission'],
        required: function () {
          return this.type != null;
        },
      },
      status: {
        type: String,
        enum: ['completed', 'pending', 'processing', 'failed'],
        default: 'pending',
      },
      courseId: {
        type: String,
        ref: 'Course',
        required: function () {
          return this.purpose === 'course_purchase';
        },
      },
      description: { type: String },
    },
    { timestamps: true }
  );

const walletSchema = new mongoose.Schema({

    _id : { type : String, default : ()=>nanoid(12) },

    userId : { type : String, refPath : 'userModel', required : true },

    userModel : { type : String, enum : ['User','Tutor','Admin'] , required : true},

    balance : { type : Number, default : 0 },

    totalEarnings : { type : Number, required : 
        function() { return ['Tutor','Admin'].includes(this.userModel) && this.transactions.length > 0 } },

    totalWithdrawals : { type : Number, required : 
        function() { return ['Tutor','Admin'].includes(this.userModel) && this.transactions.length > 0 } },

    isActive : { type : Boolean, default : false },

    transactions : [transactionSchema],

},{ timestamps : true })

const Wallet = mongoose.model('Wallet',walletSchema);

export default Wallet