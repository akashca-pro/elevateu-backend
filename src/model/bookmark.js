import mongoose from "mongoose";
import { nanoid } from "nanoid";

const bookmarkSchema = new mongoose.Schema({

    _id : { type : String, default : ()=> nanoid(12) },
    
    userId : { type : String , ref : 'User' , required : true },

    courseIdArray : [{ type : String , ref : 'Course' , required : true }],

}, { timestamps : true })

const Bookmark = mongoose.model('Bookmark',bookmarkSchema)

export default Bookmark