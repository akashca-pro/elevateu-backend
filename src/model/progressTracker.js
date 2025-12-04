import mongoose from "mongoose";
import { nanoid } from "nanoid";

const progressTrackerSchema = new mongoose.Schema({
    
    _id : { type : String, default : ()=> nanoid(12) },

    userId : { type : String, ref : 'User', required : true},

    courseId : { type : String, ref : 'Course', required : true },

    modules : [{
        _id : false,
        moduleId : { type : String ,ref : 'Course.modules'},
        moduleTitle : { type : String },
        moduleProgress : { type : Number, default : 0 },
        lessons : [{ 
            _id : false,
            lessonTitle : { type : String },
            lessonId : {type : String, ref : 'Course.modules.lessons' },
            isCompleted : { type : Boolean, default : false },
            isAddon : { type : Boolean, default : false }
        }],
        isCompleted : { type : Boolean, default : false },
        isAddon : { type : Boolean, default : false }
    }],

    level : {
        currentLevel : { type : Number , enum : [0,1,2,3,4,5] , default : 0},
        cumulativeModules : [{ type : Number }],
    },

    lastCourseUpdate : { type : Date, default : null },

    resetCount : { type : Number, default : 0 }

},{timestamps : true})

const ProgressTracker = mongoose.model('ProgressTracker',progressTrackerSchema);

export default ProgressTracker