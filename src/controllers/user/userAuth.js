import User from '../../model/user.js'
import OTP from '../../model/otp.js'
import bcrypt from 'bcryptjs'
import {generateAccessToken} from '../../utils/generateToken.js'
import { generateOtpCode } from '../../utils/generateOtp.js'
import {sendToken,clearToken} from '../../utils/tokenManage.js'
import {sendEmailResetPassword} from '../../utils/sendEmail.js'
import 'dotenv/config'
import HttpStatus from '../../utils/statusCodes.js'
import ResponseHandler from '../../utils/responseHandler.js'
import { STRING_CONSTANTS , DATABASE_FIELDS} from '../../utils/stringConstants.js'
import { saveRefreshToken } from '../../utils/verifyToken.js'

// User Registration with OTP

export const registerUser = async (req,res) => {
    
    try {

        const { email, password ,
            firstName  } = req.body;
    
        const userExists = await User.findOne({email : email});
    
        if(userExists) 
            return ResponseHandler.error(res,STRING_CONSTANTS.EXIST ,HttpStatus.CONFLICT);


        const hashedPassword = await bcrypt.hash(password,10);
        
        const user = new User({
            email,
            password : hashedPassword, 
            firstName,
            isVerified : true,
            isActive : true
        });
    
        await user.save();

        const userData = await User.findOne({email})
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB
        ].join(' '))

        const accessToken = generateAccessToken(user._id);
    
        // Set access token as cookie (24 hour)
        sendToken(res, process.env.USER_ACCESS_TOKEN_NAME,accessToken, 1 * 24 * 60 * 60 * 1000);

        return ResponseHandler.success(res, STRING_CONSTANTS.REGISTRATION_SUCCESS, HttpStatus.OK,userData);

    } catch (error) {
        console.log(STRING_CONSTANTS.REGISTRATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.REGISTRATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

//Login with JWT

export const loginUser = async (req,res) => {
   
    try {
        const {email,password} = req.body;

        const user = await User.findOne({email})
    
        if(!user) 
            return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    
        
        if(!(await bcrypt.compare(password,user.password)))
            return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_PASSWORD, HttpStatus.BAD_REQUEST);
        

        if(!user.isVerified)
            return ResponseHandler.error(res,STRING_CONSTANTS.VERIFICATION_ERROR ,HttpStatus.NOT_ACCEPTABLE);

        if(!user.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)
        
       const accessToken = generateAccessToken(user._id);
    
        // Set access token as cookie (24 hour)
        sendToken(res, process.env.USER_ACCESS_TOKEN_NAME,accessToken, 1 * 24 * 60 * 60 * 1000)
        
        req.User = user._id

        await saveRefreshToken(req,res,'User')

        const data = await User.findOne({email})
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.GOOGLE_ID
        ].join(' '))

        return ResponseHandler.success(res, STRING_CONSTANTS.LOGIN_SUCCESS, HttpStatus.OK, data)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOGIN_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOGIN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

//reset link generating for password reset

export const forgotPassword = async (req,res) => {
    
    try {
        const {role, otpType, email} = req.body;
        const user = await User.findOne({email})

        if(!user)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        if(!user.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

        const {otp} = generateOtpCode();

        await OTP.create({
            email,
            role,
            otp,
            otpType ,
            otpExpires : new Date(Date.now() + 5 * 60 * 1000)
        });

        await sendEmailResetPassword(email, user.firstName, otp)

        return ResponseHandler.success(res, STRING_CONSTANTS.RESET_OTP, HttpStatus.OK)
        
    } catch (error) {
        console.log(STRING_CONSTANTS.OTP_SENT_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR) 
    }

}

// verify the resetPassword token and create new password

export const verifyResetLink = async (req,res) => {
    
    try {
        const {role, email, password ,otp ,otpType} = req.body;

        const user = await User.findOne({email});

        if(!user) 
            return ResponseHandler.error(res,STRING_CONSTANTS.OTP_ERROR ,HttpStatus.BAD_REQUEST);

        if(!user.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

        const otpRecord = await OTP.findOne({role , email , otp , otpType })
        
        if(!otpRecord) return ResponseHandler.error(res, STRING_CONSTANTS.OTP_ERROR, HttpStatus.BAD_REQUEST)
        
        await OTP.findByIdAndDelete(otpRecord._id)

        const hashedPassword = await bcrypt.hash(password,10);

        if(!user.isVerified) user.isVerified = true
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        return ResponseHandler.success(res, STRING_CONSTANTS.PASSWORD_RESET_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.PASSWORD_RESET_ERROR, error);
        return  ResponseHandler.error(res, STRING_CONSTANTS.PASSWORD_RESET_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// clear Token 

export const logoutUser = async (req,res) => {

    try {

        clearToken(res, process.env.USER_ACCESS_TOKEN_NAME, process.env.USER_REFRESH_TOKEN_NAME)

        return ResponseHandler.success(res, STRING_CONSTANTS.LOGOUT_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOGOUT_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOGOUT_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
}

// google callback

export const passportCallback = async (req,res) => {
    
    try {

        if(!req.user)  
            return ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.NOT_FOUND)

        const {user,token} = req.user;

        sendToken(res, process.env.USER_ACCESS_TOKEN_NAME,token, 1 * 24 * 60 * 60 * 1000);

        return res.status(HttpStatus.OK).redirect(`${process.env.CLIENT_URL}/user/auth-success`);
        
    } catch (error) {
        console.log(STRING_CONSTANTS.GOOGLE_AUTH_ERROR, error);
        return  ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// google failure 

export const authFailure = async (req,res) => {

    res.status(HttpStatus.NOT_FOUND).json({ message: "Google authentication failed. Please try again." });
    
}

export const authLoad = async (req,res) => {
    
    try {
        const {id} = req.user

        const user = await User.findById(id)
        if(!user) 
            return ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.NOT_FOUND)
            
        return ResponseHandler.success(res, STRING_CONSTANTS.GOOGLE_AUTH_SUCCESS, HttpStatus.OK,user)
        
    } catch (error) {
        console.log(STRING_CONSTANTS.GOOGLE_AUTH_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}