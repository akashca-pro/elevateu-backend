import mongoose from "mongoose";
import { nanoid } from "nanoid";

const certificateSchema = new mongoose.Schema({
      
    _id: { type: String, default: () => `CERT-${nanoid(12)}` },

    user : {
        id : { type : String, ref : 'User', required : true },
        name : { type : String, required : true },
        email : { type : String, required : true }
    },

    tutor : {
        id : { type : String, ref : 'Tutor', required : true },
        name : { type : String, required : true },
        email : { type : String, required : true },
        expertise : { type : String, required : true }
    },

    course : {
        id : { type : String, ref : 'Course', required : true },
        title : { type : String, required : true },
        duration : { type : Number, required : true },
        level : { type : String, required : true }
    },

},{ timestamps : true })

const Certificate = mongoose.model('Certificate',certificateSchema);

export default Certificate