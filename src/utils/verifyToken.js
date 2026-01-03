import 'dotenv/config'
import jwt from "jsonwebtoken";
import HttpStatus from './statusCodes.js';
import User from '../model/user.js';
import Admin from '../model/admin.js';
import Tutor from '../model/tutor.js';
import ResponseHandler from './responseHandler.js';
import { STRING_CONSTANTS } from './stringConstants.js';
import RefreshToken from '../model/refreshToken.js';
import { generateAccessToken, generateRefreshToken } from './generateToken.js';
import { sendToken } from './tokenManage.js';

const TOKEN_NAMES = {
    user: process.env.USER_ACCESS_TOKEN_NAME,
    tutor: process.env.TUTOR_ACCESS_TOKEN_NAME,
    admin: process.env.ADMIN_ACCESS_TOKEN_NAME
};

const REFRESH_TOKEN = {
    user : process.env.USER_REFRESH_TOKEN_NAME,
    tutor : process.env.TUTOR_REFRESH_TOKEN_NAME,
    admin : process.env.ADMIN_REFRESH_TOKEN_NAME
}

const roleModels = {
    user : User,
    tutor : Tutor,
    admin : Admin
}

const getRoleModel = (role) => roleModels[role.toLowerCase()];

export const verifyAccessToken = (role) => async(req, res, next) => {
    try {
    const tokenName = TOKEN_NAMES[role];
    
    if (!tokenName) {
        return ResponseHandler.error(res, STRING_CONSTANTS.TOKEN_ISSUE_ERROR,HttpStatus.NOT_FOUND);  
    }
    
    const token = req.cookies[tokenName];
    if (!token) {
        return ResponseHandler.error(res, STRING_CONSTANTS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED)
    }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req[role] = decoded;
    
            const db = getRoleModel(role);
    
            const user = await db.findById(decoded.id)

            if (!user) {
                return ResponseHandler.error(res, STRING_CONSTANTS.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            
            if(user.isBlocked && role !== 'admin')
                return ResponseHandler.error(res,STRING_CONSTANTS.NOT_ALLOWED, HttpStatus.FORBIDDEN)
    
            if(!user.isActive && role !== 'admin')
                return ResponseHandler.error(res,STRING_CONSTANTS.ACCOUNT_IS_DEACTIVATED,HttpStatus.FORBIDDEN)

            next();
        } catch (error) {
            console.log(STRING_CONSTANTS.TOKEN_ISSUE_ERROR,error);
            return ResponseHandler.error(res, STRING_CONSTANTS.UNAUTHORIZED, HttpStatus.UNAUTHORIZED)
        }

    } catch (error) {
        console.log(STRING_CONSTANTS.TOKEN_VERIFY_ERROR,HttpStatus.INTERNAL_SERVER_ERROR)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }
};

export const verifyRefreshToken = (role) => async(req,res,next)=>{
    
    try {
        const id = req.params.id;

        const db = getRoleModel(role);

        const user = await db.findById(id)

        if (!user) {
            return ResponseHandler.error(res, STRING_CONSTANTS.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if(user.isBlocked){
            return ResponseHandler.error(res,STRING_CONSTANTS.BLOCKED, HttpStatus.FORBIDDEN)
        }

        const refreshToken = await RefreshToken.findOne({ user : id, userType : role })

        if (!refreshToken) {
            return ResponseHandler.error(res, STRING_CONSTANTS.TOKEN_NOT_FOUND, HttpStatus.FORBIDDEN);
        }

        try {
            const decoded = jwt.verify(refreshToken.token, process.env.JWT_REFRESH);
            req[role] =  decoded;
            req.role = role
            next();
        } catch (error) {
            console.log(STRING_CONSTANTS.TOKEN_ISSUE_ERROR,error);
            return ResponseHandler.error(res, STRING_CONSTANTS.TOKEN_EXPIRED, HttpStatus.FORBIDDEN);
        }

    } catch (error) {
        console.log(STRING_CONSTANTS.TOKEN_VERIFY_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// create and save refresh token in the db

export const saveRefreshToken = async(req,res,role)=>{

    try {
        const id = req[role]

        const alreadyExist = await RefreshToken.findOne({ user : id, userType : role })

        if(alreadyExist)
            await RefreshToken.findOneAndDelete({ user : id, userType : role })

        const refreshToken = generateRefreshToken(id)

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
   
        await RefreshToken.create({
            user : id,
            userType : role,
            token : refreshToken,
            expiresAt : futureDate.toISOString()
        })

        return true;

    } catch (error) {
        console.log(STRING_CONSTANTS.TOKEN_ISSUE_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// Refresh Token End point (Reissue Access Token)

export const refreshAccessToken = async (req,res) => {
   
    try {
        const role = req.role;
        const decoded = req[role];
        const newAccessToken = generateAccessToken(decoded.id);

        const tokenName = TOKEN_NAMES[role.toLowerCase()]

        sendToken(res, tokenName, newAccessToken, 1 * 24 * 60 * 60 * 1000)

        await saveRefreshToken(req, res, req.role);
    
        return ResponseHandler.success(res, STRING_CONSTANTS.TOKEN_ISSUED, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.TOKEN_ISSUE_ERROR, error.message);
        return ResponseHandler.error(res, STRING_CONSTANTS.TOKEN_ISSUE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
}