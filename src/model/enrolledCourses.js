import mongoose from "mongoose";
import { nanoid } from "nanoid";

const enrollmentSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => nanoid(12),
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    paymentDetails : {
        transactionId : { type : String , required : function(){ return this.paymentDetails?.amountPaid > 0 } },
        amountPaid : { type : Number ,default : 0, required : true},
        orderId : { type : String, ref : 'Order' }
    },
    courseId : {
        type: String,
        ref: "Course",
        required: true,
    },
    courseName : {
        type : String
    },
    courseProgress : {
        type : Number,
        default : 0
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const EnrolledCourse = mongoose.model("EnrolledCourse", enrollmentSchema);

export default EnrolledCourse;
