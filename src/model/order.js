import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Course from "./course.js";

const orderSchema = new mongoose.Schema({
    _id : { type : String, default : ()=> nanoid(12) },

    userId : { type : String, ref : 'User', required : true},
    
    userData : {
        name : { type : String, required : true },
        email : { type : String , required : true}
    },

    courseId : { type : String, ref : 'Course', required : true },

    categoryId : { type : String, ref : 'Category', required : true },

    courseName : { type : String },

    paymentStatus : { type : String, enum : ['pending','success','failed'] , default : 'pending'},

    price : { 
        originalPrice : { type : Number, required : true },
        courseDiscount :  { type : Number },
        couponCode : { type : String },
        discountType : { type : String },
        couponDiscount : { type : Number },
        finalPrice : { type : Number, required : true }
     },

     paymentDetails : {
        transactionId : { type : String },
        orderId : { type : String , required : true }
     },

}, { timestamps : true });

orderSchema.pre('save', async function (next) {

    try {
        if(this.courseId){
            const course = await Course.findById(this.courseId).select('title');
            if(course){
                this.courseName = course.title;
            }
            next();
        }
    } catch (error) {
        next(error);
    }
    
})

const Order = mongoose.model('Order',orderSchema);

export default Order