import mongoose from "mongoose";
import { nanoid } from "nanoid";

const categorySchema = new mongoose.Schema({
    _id : {
        type : String,
        default : ()=>nanoid(12)
    },
    name : {
        type : String,
        required : true,
        trim :true,
        unique : true
    },
    description :{
        type : String,
    },
    icon : {
        type : String,
    },
    isActive : {
        type : Boolean,
        default : false
    }
},{timestamps : true})

const Category = mongoose.model('Category',categorySchema)

export default Category