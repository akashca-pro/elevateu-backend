import User from '../../model/user.js'
import ResponseHandler from '../../utils/responseHandler.js';
import HttpStatus from '../../utils/statusCodes.js'
import { DATABASE_FIELDS, STRING_CONSTANTS } from '../../utils/stringConstants.js';

// View Profile

export const loadProfile = async (req,res) => {
    
    try {
        const user_ID = req.user.id
        const userData = await User.findById(user_ID)
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.PHONE,
            DATABASE_FIELDS.ENROLLED_COURSES
        ].join(' '));
    
        if(!userData)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, userData)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Update profile

export const updateProfile = async (req,res) => {
    
    try {
        const user_ID = req.params.id;
        const user = await User.findById(user_ID)
        if(!user) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        const {firstName, lastName, profileImage, phone, bio, dob} = req.body;

        await User.findByIdAndUpdate(user_ID , {
            firstName,
            lastName,
            profileImage,
            phone,
            bio,
            dob
        })

        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}
