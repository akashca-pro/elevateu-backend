import mongoose from "mongoose";
import {nanoid} from 'nanoid'

const tutorSchema = mongoose.Schema({
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
    phone : {
        type : String
    },
    googleID : {
        type : String  
    },
    profileImage : {
        type : String,
        default : ""
    },
    bio : {
        type : String,
        trim : true
    },
    tagLine : {
        type : String,
        default : ''
    },
    dob : {
        type : String,
        default : ''
    },
    socialLinks :{
        type : [String],
        default : [] 
    },
    expertise: {
        type: [String], 
        default : []
    },
    experience: {
        type: String, 
        default : 0
    },
    earnings: {
        type: Number,
        default: 0,
    },
    bankDetails : {
        accountNumber : { type : String},
        ifsc : { type : String },
        bankName : { type : String},
        holderName : { type : String}
    },
    isVerified : {
        type : Boolean,
        default : false
    },
    isActive : {
        type : Boolean,
        default : false
    },
    isAdminVerified : {
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
    status : {
        type : String,
        enum : ['pending','approved','rejected','none'],
        default : 'none'
    },
    reason : {
        type : String,
    },
    isBlocked : {
        type : Boolean,
    },
    draftCount : {
        type : Number,
        default : 0
    },
    rating : {
        type : Number
    },
    students : [{ type : String }],
    courseCount : {
        type : Number,
        default : 0
    }
},{timestamps : true});

tutorSchema.post('save', async function (doc) {
    
    try {
        const Wallet = (await import('./wallet.js')).default;

        const existingWallet = await Wallet.findOne({ userId : doc._id, userModel : 'Tutor' })
        if(!existingWallet){
            await Wallet.create({
                userId : doc._id,
                userModel : 'Tutor',
                balance : 0,
                isActive : true
            });
        }

    } catch (error) {
        console.error('Error creating tutor wallet:', error);
    }

})

const Tutor = mongoose.model("Tutor",tutorSchema);

export default Tutor