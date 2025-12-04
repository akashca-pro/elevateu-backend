import mongoose  from "mongoose";
import {nanoid} from 'nanoid'

const userSchema  = new mongoose.Schema({
    _id : {
        type : String,
        default : ()=>nanoid(12)
    },
    email : {
        type : String,
        required : true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password : {
        type : String,
        required : function () {
            return !this.googleID;}
    },
    firstName : {
        type: String,
        required: true,
        trim: true,
    },
    lastName : {
        type: String,
        trim: true,
    },
    googleID : {
        type : String  
    },
    profileImage : {
        type : String,
        default : ""
    },
    phone : {
        type : String,
    },
    dob : {
        type : String,
        default : ''
    },
    enrolledCourses : {
        type : [String],
    },
    bio : {
        type : String,
        trim : true,
    },
    socialLinks : {
        type : [String]
    },
    isVerified : {
        type : Boolean,
        default : false
    },
    isActive : {
        type : Boolean,
        default : false
    },
    tempMail :{
        type : String,
        expires : 600
    },
    tempPassword : {
        type : String,
        expires : 600
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    bookmarks : [{ type : String , ref : 'Course' }],

    cart : { type : String , ref : 'Course' },
    
},{timestamps : true});

userSchema.post('save', async function (doc) {
    
    try {
        const Wallet = (await import('./wallet.js')).default;

        const existingWallet = await Wallet.findOne({ userId : doc._id, userModel : 'User' })
        if(!existingWallet){
            await Wallet.create({
                userId : doc._id,
                userModel : 'User',
                balance : 0,
                isActive : true
            });
        }

    } catch (error) {
        console.error('Error creating user wallet:', error);
    }

})

const User = mongoose.model("User",userSchema);

export default User