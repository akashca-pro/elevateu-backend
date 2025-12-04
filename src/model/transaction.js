import mongoose from "mongoose";
import { nanoid } from "nanoid";

const transactionSchema = new mongoose.Schema({

    _id : { type : String, default : ()=>nanoid(12) },

    type : { type : String, enum : ['course_purchase','tutor_withdrawal','admin_withdrawal','user_withdrawal'] },

    source : {
        userId : { type : String, 
            ref : 'User',
            required : function() { return this.type === 'course_purchase' } 
        },

        courseId : { type : String,
            ref : 'Course',
            required : function() { return this.type === 'course_purchase' }
        },

        tutorId : { type : String, 
            ref : 'Tutor',
            required : function() { return ['course_purchase','tutor_withdrawal'].includes(this.type) } 
        },

        adminId : { type : String,
            ref : 'Admin',
            required : function() { return ['course_purchase','admin_withdrawal'].includes(this.type) }
        },
    },

    amount : {
        courseAmount : { type : Number, required : function() { return this.type === 'course_purchase' } },

        tutorPayout : { type : Number, required : function() { return ['course_purchase','tutor_withdrawal'].includes(this.type) } },

        adminPayout : { type : Number, required : function() { return ['course_purchase','admin_withdrawal'].includes(this.type) } }
    },

    orderId : { type : String, ref : 'Order' , required : function() { return this.type === 'course_purchase' } },

}, { timestamps : true })

const Transaction = mongoose.model('Transaction',transactionSchema)

export default Transaction