import mongoose from "mongoose";
import { nanoid } from "nanoid";

const notificationSchema = new mongoose.Schema({
    _id : {type : String , default : ()=> nanoid(12) },

    recipientId : { type : String, required : true, refPath : 'recipientType'}, // User, Tutor, or Admin ID
    recipientType : { type : String, enum : ['User','Tutor','Admin'], required : true},

    senderId : { type : String, refPath : 'senderType' },
    senderType : { type : String, enum : ['User','Tutor','Admin'],required : function(){ return !!this.senderId }},

    type : { type : String, 
        enum : ['publish_request','verify_profile','new_enrollment','payment_update','course_approved','course_rejected'
            ,'suspend_course','suspension_removed','withdraw_request','withdraw_rejected','withdraw_approved'] },

    message : {type : String, required : true},

    isRead : { type : Boolean, required : true , default : false},

    readAt : { type : Date, default : null }

},{ timestamps: true })


const Notification = mongoose.model('Notification',notificationSchema)

export default Notification