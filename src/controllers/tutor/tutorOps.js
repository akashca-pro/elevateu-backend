import Tutor from '../../model/tutor.js'
import ResponseHandler from '../../utils/responseHandler.js';
import HttpStatus from '../../utils/statusCodes.js';
import { DATABASE_FIELDS, STRING_CONSTANTS } from '../../utils/stringConstants.js';

// View Profile

export const loadProfile = async (req,res) => {
    
    try {
        const tutor_ID = req.tutor.id 
        const tutorData = await Tutor.findById(tutor_ID)
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.PHONE,
            DATABASE_FIELDS.IS_ADMIN_VERIFIED,
            DATABASE_FIELDS.EXPERTISE,
            DATABASE_FIELDS.EXPERIENCE,
            DATABASE_FIELDS.STATUS,
            DATABASE_FIELDS.REASON
        ].join(' '));

    
        if(!tutorData)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, tutorData)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Update profile

export const updateProfile = async (req,res) => {
    
    try {
        const tutor_ID = req.tutor.id;
        const tutor = await Tutor.findById(tutor_ID)
        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const {firstName, lastName, profileImage, phone, bio,
             expertise, experience, earnings , dob} = req.body;
            
        await Tutor.findByIdAndUpdate(tutor_ID , {
            firstName,
            lastName,
            profileImage,
            phone,
            bio,
            expertise,
            experience,
            dob
        })

        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// delete account

export const deleteAccount = async (req,res) =>{

    try {
        const tutor_ID = req.params.id
        const tutor = await Tutor.findById(tutor_ID)
        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        await Tutor.findByIdAndDelete(tutor_ID)

        return ResponseHandler.success(res,STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.DELETION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// request verification

export const requestVerification = async (req,res) => {
    
    try {
        const tutorID = req.params.id
        const tutor = await Tutor.findById(tutorID)
        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        const existingRequest = await Tutor.findOne({ _id : tutorID , status : 'pending' })

        if(existingRequest) 
            return ResponseHandler.error(res, STRING_CONSTANTS.STATUS_PENDING, HttpStatus.CONFLICT);

        await Tutor.findByIdAndUpdate(tutorID,{
            status : 'pending'
        },)

        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}