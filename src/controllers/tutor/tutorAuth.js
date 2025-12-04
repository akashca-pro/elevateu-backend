import 'dotenv/config'
import Tutor from '../../model/tutor.js'
import bcrypt from 'bcryptjs'
import {generateAccessToken,generateRefreshToken} from '../../utils/generateToken.js'
import { generateOtpCode } from '../../utils/generateOtp.js'
import {sendToken,clearToken} from '../../utils/tokenManage.js'
import {sendEmailResetPassword} from '../../utils/sendEmail.js'
import HttpStatus from '../../utils/statusCodes.js'
import { DATABASE_FIELDS, STRING_CONSTANTS } from '../../utils/stringConstants.js'
import ResponseHandler from '../../utils/responseHandler.js'
import OTP from '../../model/otp.js'
import { saveRefreshToken } from '../../utils/verifyToken.js'

// Tutor register with otp

export const registerTutor = async (req,res) => {
    
    try {

        const { email , password ,
            firstName  } = req.body;
    
        const tutorExists = await Tutor.findOne({email : email});
    
        if(tutorExists) 
            return ResponseHandler.error(res,STRING_CONSTANTS.EXIST ,HttpStatus.CONFLICT);


        const hashedPassword = await bcrypt.hash(password,10);
        
        const tutor = new Tutor({
            email,
            password : hashedPassword, 
            firstName,
            isVerified : true,
            isActive : true
        });
    
        await tutor.save();

        const accessToken = generateAccessToken(tutor._id);
    
        // Set access token as cookie (24 hour)
        sendToken(res, process.env.TUTOR_ACCESS_TOKEN_NAME, accessToken, 1 * 24 * 60 * 60 * 1000)
    
        const data = await Tutor.findOne({email})
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.IS_ADMIN_VERIFIED,
            DATABASE_FIELDS.EXPERTISE,
            DATABASE_FIELDS.EXPERIENCE,
            DATABASE_FIELDS.STATUS,
            DATABASE_FIELDS.REASON
        ].join(' '))
        
        return ResponseHandler.success(res, STRING_CONSTANTS.REGISTRATION_SUCCESS, HttpStatus.OK,data);

    } catch (error) {
        console.log(STRING_CONSTANTS.REGISTRATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.REGISTRATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

//Login with JWT

export const loginTutor = async (req,res) => {
   
    try {
        const {email,password} = req.body;

        const tutor = await Tutor.findOne({email});
    
        if(!tutor)
            return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    
        if(!(await bcrypt.compare(password,tutor.password)))
            return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_PASSWORD, HttpStatus.BAD_REQUEST);

        if(!tutor.isVerified)
            return ResponseHandler.error(res,STRING_CONSTANTS.VERIFICATION_ERROR ,HttpStatus.NOT_ACCEPTABLE);
        
        if(!tutor.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

       const accessToken = generateAccessToken(tutor._id);
    
        // Set access token as cookie (24 hour)
        sendToken(res, process.env.TUTOR_ACCESS_TOKEN_NAME, accessToken, 1 * 24 * 60 * 60 * 1000)
    
        req.Tutor = tutor._id
        
    
        const data = await Tutor.findOne({email})
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.IS_ADMIN_VERIFIED,
            DATABASE_FIELDS.EXPERTISE,
            DATABASE_FIELDS.EXPERIENCE,
            DATABASE_FIELDS.STATUS,
            DATABASE_FIELDS.REASON
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
        const tutor = await Tutor.findOne({email})

        if(!tutor)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        if(!tutor.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

        const {otp} = generateOtpCode();

        await OTP.create({
            email,
            role,
            otp,
            otpType ,
            otpExpires : new Date(Date.now() + 5 * 60 * 1000)
        });

        await sendEmailResetPassword(email, tutor.firstName, otp)

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

        const tutor = await Tutor.findOne({email});

        if(!tutor) 
            return ResponseHandler.error(res,STRING_CONSTANTS.OTP_ERROR ,HttpStatus.BAD_REQUEST);

        if(!tutor.isActive)
            return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

        const otpRecord = await OTP.findOne({role , email , otp , otpType })
        
        if(!otpRecord) return ResponseHandler.error(res, STRING_CONSTANTS.OTP_ERROR, HttpStatus.BAD_REQUEST)
        
        await OTP.findByIdAndDelete(otpRecord._id)

        const hashedPassword = await bcrypt.hash(password,10);

        if(!tutor.isVerified) tutor.isVerified = true
        tutor.password = hashedPassword;
        tutor.otp = undefined;
        tutor.otpExpires = undefined;

        await tutor.save();

        return ResponseHandler.success(res, STRING_CONSTANTS.PASSWORD_RESET_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.PASSWORD_RESET_ERROR, error);
        return  ResponseHandler.error(res, STRING_CONSTANTS.PASSWORD_RESET_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// clear Token 

export const logoutTutor = async (req,res) => {

    try {

        clearToken(res, process.env.TUTOR_ACCESS_TOKEN_NAME, process.env.TUTOR_REFRESH_TOKEN_NAME);
        
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

        const {tutor,token} = req.user;

        sendToken(res, process.env.TUTOR_ACCESS_TOKEN_NAME,token, 1 * 24 * 60 * 60 * 1000);

        return res.status(HttpStatus.OK).redirect(`${process.env.CLIENT_URL}/tutor/auth-success`);
        
    } catch (error) {
        console.log(STRING_CONSTANTS.GOOGLE_AUTH_ERROR, error);
        return  ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// google failure 

export const authFailure = async (req,res) => {

    return res.redirect(`${process.env.CLIENT_URL}/user/login`);

}


export const authLoad = async (req,res) => {
    
    try {
        const {id} = req.tutor

        const tutor = await Tutor.findById(id)
        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.NOT_FOUND)

        return ResponseHandler.success(res, STRING_CONSTANTS.GOOGLE_AUTH_SUCCESS, HttpStatus.OK,tutor)
        
    } catch (error) {
        console.log(STRING_CONSTANTS.GOOGLE_AUTH_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.GOOGLE_AUTH_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

export const isTutorVerified = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id
        const tutor = await Tutor.findById(tutorId)

        if(!tutor)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.OK)

        if(!tutor.isAdminVerified)
            return ResponseHandler.error(res, STRING_CONSTANTS.NOT_ALLOWED, HttpStatus.LOCKED)

        return ResponseHandler.success(res, STRING_CONSTANTS.ALLOWED, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.NOT_ALLOWED, error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}