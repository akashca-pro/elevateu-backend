import mongoose from "mongoose";
import { nanoid } from "nanoid";

const refreshTokenSchema = new mongoose.Schema({

    _id : { type :String, default : ()=>nanoid(12) },

    user : { type : String , refPath : 'userType', required : true },

    userType : { type : String, enum : ['User','Tutor','Admin'] },

    token : { type : String, required  : true },

    expiresAt: { type: Date, required: true },

}, { timestamps : true } )

const RefreshToken = mongoose.model('RefreshToken',refreshTokenSchema)

export default RefreshToken