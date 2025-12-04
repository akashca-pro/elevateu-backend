import mongoose from "mongoose";
import { nanoid } from "nanoid";

const adminSchema = mongoose.Schema({
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
        required : true,
    },
    firstName : {
        type : String,
        required : true,
        trim : true
    },
    lastName : {
        type : String,
        trim : true,
        default : ''
    },
    profileImage : {
        type : String,
        default : ''
    }

},{timestamps : true});

adminSchema.post('save', async function (doc) {
    
    try {
        const Wallet = (await import('./wallet.js')).default;

        const existingWallet = await Wallet.findOne({ userId : doc._id, userModel : 'Admin' })
        if(!existingWallet){
            await Wallet.create({
                userId : doc._id,
                userModel : 'Admin',
                balance : 0,
                isActive : true
            });
        }

    } catch (error) {
        console.error('Error creating admin wallet:', error);
    }

})

const Admin = mongoose.model('Admin',adminSchema)

export default Admin