import Notification from '../../model/notification.js';
import Tutor from '../../model/tutor.js'
import { connectedUsers } from '../../services/socketServer.js';
import ResponseHandler from '../../utils/responseHandler.js';
import HttpStatus from '../../utils/statusCodes.js';
import { DATABASE_FIELDS, STRING_CONSTANTS } from '../../utils/stringConstants.js';


// create tutor

export const addTutor = async (req,res) => {
    
    try {
        const {email, password , firstName, lastName, phone, profileImage, enrolledCourses,
             bio, socialLinks ,expertise ,experience, earnings, 
             isVerified, isActive, isBlocked ,isAdminVerified} = req.body;

        const emailExist = await Tutor.findOne({email})
        if(emailExist)
             return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);  

        const tutor = await Tutor.create({
            email, 
            password, 
            firstName, 
            lastName, 
            phone, 
            profileImage, 
            enrolledCourses,
            bio, 
            socialLinks, 
            expertise, 
            experience, 
            earnings,
            isVerified: isVerified === 'true',
            isActive: isActive === 'true',
            isBlocked: isBlocked === 'true',
            isAdminVerified: isAdminVerified === 'true'
        });

        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.CREATED,tutor)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOGIN_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOGIN_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// view tutors details

export const loadTutors = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 7;
        const skip = (page - 1) * limit;
        const { search, filter } = req.query;

        let sort = { createdAt: -1 }; // Default sorting (Newest first)
        let filterQuery = {}; 

        // Handle filter conditions
        if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
        } else if (filter === "active") {
            filterQuery.isActive = true;
        } else if (filter === "notActive") {
            filterQuery.isActive = false;
        }

        // Apply search on both name & email
        if (search) {
            filterQuery.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }


        const tutorData = await Tutor.find(search ? filterQuery : {})
        .skip(skip)
        .limit(limit)
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.PHONE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.IS_ACTIVE,
            DATABASE_FIELDS.IS_BLOCKED,
            DATABASE_FIELDS.IS_ADMIN_VERIFIED,
            DATABASE_FIELDS.EXPERTISE,
            DATABASE_FIELDS.EXPERIENCE,
        ].join(' '))

        const totalTutors = await Tutor.countDocuments(filterQuery);

        if(!tutorData || tutorData.length === 0) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, {
            tutors: tutorData,
            total: totalTutors,
            currentPage: page,
            totalPages: Math.ceil(totalTutors / limit),
        });
        
    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// view specific tutor details

export const loadTutorDetails = async (req,res) => {
    
    try {
        const tutor_ID = req.params.id
        const tutor = await Tutor.findById(tutor_ID)
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.PHONE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.IS_ACTIVE,
            DATABASE_FIELDS.IS_BLOCKED,
            DATABASE_FIELDS.IS_ADMIN_VERIFIED,
            DATABASE_FIELDS.EXPERTISE,
            DATABASE_FIELDS.EXPERIENCE,
        ].join(' '));

        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
            
        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, tutor)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

} 

// update tutor details

export const updateTutorDetails = async (req,res) => {
    
    try {
        
        const tutor_ID = req.params.id;

        const tutorData = await Tutor.findById(tutor_ID);
        if(!tutorData) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const {firstName, lastName, profileImage, expertise, experience, earnings,
             isVerified, isActive, isBlocked, isAdminVerified } = req.body

        const updatedFields = {
            firstName , lastName , profileImage , expertise , experience , earnings
        }

        if(isVerified !== undefined) updatedFields.isVerified = isVerified === 'true'

        if(isActive !== undefined) updatedFields.isActive = isActive === 'true'

        if(isBlocked !== undefined) updatedFields.isBlocked = isBlocked === 'true' 

        if(isAdminVerified !== undefined) updatedFields.isAdminVerified = isAdminVerified === 'true'

        await Tutor.findByIdAndUpdate(
            tutor_ID, 
            updatedFields ,
            )
             
        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// delete tutor

export const deleteTutor = async (req,res) => {
    
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

// load verification requests

export const loadRequests = async (req,res) => {
    
    try {
        const request = await Tutor.find({status : 'pending'})
        .select('_id email firstName lastName profileImage  bio experience expertise createdAt');

        if(!request || request.length===0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.ok);

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, request);

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// approve or reject verification requests 

export const approveOrRejectrequest = async (req,res) => {
    
    try {
        const {id , input , reason} = req.body

        const tutor = await Tutor.findById(id)

        let newNotification = {}

        if(!tutor) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(tutor.status === 'approved' || tutor.status === 'rejected') 
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);

        if(input === 'approve'){
            await Tutor.findByIdAndUpdate(id,{
                status : 'approved',
                reason,
                isAdminVerified : true
            })

            newNotification = await Notification.create({
                recipientId : id,
                recipientType : 'Tutor',
                type : 'verify_profile',
                message : `Hi ${tutor.firstName}, your profile is verified. Now you can upload courses ${reason}`
            })

            if(connectedUsers[newNotification.recipientId]){
                const socketId = connectedUsers[newNotification.recipientId].socketId
                req.io.to(socketId).emit('newNotification',newNotification)
            }

            return ResponseHandler.success(res,`Verification approved for ${tutor?.firstName}`,HttpStatus.OK)
        } 
        else if(input === 'reject') {
            await Tutor.findByIdAndUpdate(id,{status : 'rejected' , reason})

            newNotification = await Notification.create({
                recipientId : id,
                recipientType : 'Tutor',
                type : 'verify_profile',
                message : `Hi ${tutor.firstName}, your profile is rejected. ${reason}`
            })

            if(connectedUsers[newNotification.recipientId]){
                const socketId = connectedUsers[newNotification.recipientId].socketId
                req.io.to(socketId).emit('newNotification',newNotification)
            }

            return ResponseHandler.success(res,`Verification rejected for ${tutor?.firstName}`,HttpStatus.OK)
        }   
        else return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_INPUT, HttpStatus.BAD_REQUEST);

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// block or unblock tutor

export const toggleTutorBlock = async (req,res) => {
    
    try {
        const tutorId = req.params.id;

        const tutor = await Tutor.findById(tutorId);

        if(!tutor) return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        tutor.isBlocked = !tutor.isBlocked;
        await tutor.save();

        const message = tutor.isBlocked ? STRING_CONSTANTS.BLOCKED : STRING_CONSTANTS.UNBLOCKED;
        return ResponseHandler.success(res, message, HttpStatus.OK);


    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
