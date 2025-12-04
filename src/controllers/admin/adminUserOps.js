import User from '../../model/user.js'
import ResponseHandler from '../../utils/responseHandler.js';
import HttpStatus from '../../utils/statusCodes.js';
import { DATABASE_FIELDS, STRING_CONSTANTS } from '../../utils/stringConstants.js';

// create user

export const addUser = async (req,res) => {
    
    try {
        const {email, password , firstName, lastName, phone, profileImage, enrolledCourses,
             bio, socialLinks, isVerified, isActive, isBlocked} = req.body;

        const emailExist = await User.findOne({email})
        if(emailExist)
             return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);   

        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phone,
            profileImage,
            enrolledCourses,
            bio,
            socialLinks,
            isVerified: isVerified === 'true',
            isActive: isActive === 'true',
            isBlocked: isBlocked === 'true',
        });

        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.CREATED,user)

    } catch (error) {
        console.log(STRING_CONSTANTS.CREATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.CREATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// view users details

export const loadUsers = async (req, res) => {
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

        // Fetch paginated users
        const userData = await User.find(filterQuery)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .select([
                DATABASE_FIELDS.ID,
                DATABASE_FIELDS.EMAIL,
                DATABASE_FIELDS.FIRST_NAME,
                DATABASE_FIELDS.IS_ACTIVE,
                DATABASE_FIELDS.IS_BLOCKED,
                DATABASE_FIELDS.PROFILE_IMAGE,
                DATABASE_FIELDS.PHONE
            ].join(' '));

        // Count total matching users
        const totalStudents = await User.countDocuments(filterQuery);

        // If no data found
        if (!userData || userData.length === 0) {
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // Success response
        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, {
            users: userData,
            total: totalStudents,
            currentPage: page,
            totalPages: Math.ceil(totalStudents / limit),
        });

    } catch (error) {
        console.error(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

// view specific user details

export const loadUserDetails = async (req,res) => {
    
    try {
        const user_ID = req.params.id
        const user = await User.findById(user_ID)
        .select([
            DATABASE_FIELDS.ID,
            DATABASE_FIELDS.EMAIL,
            DATABASE_FIELDS.FIRST_NAME,
            DATABASE_FIELDS.LAST_NAME,
            DATABASE_FIELDS.PROFILE_IMAGE,
            DATABASE_FIELDS.BIO,
            DATABASE_FIELDS.DOB,
            DATABASE_FIELDS.PHONE,
            DATABASE_FIELDS.IS_ACTIVE,
            DATABASE_FIELDS.IS_BLOCKED,
            DATABASE_FIELDS.ENROLLED_COURSES
        ].join(' '));

        if(!user) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
            
        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, user)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

} 

// update user details

export const updateUserDetails = async (req,res) => {
    
    try {
        
        const user_ID = req.params.id;
        const userData = await User.findById(user_ID);
        if(!userData) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const {firstName, lastName, profileImage, enrolledCourses,
             isVerified, isActive, isBlocked } = req.body

        const updatedFields = {
            firstName , lastName , profileImage , enrolledCourses
        }

        if(isVerified !== undefined) updatedFields.isVerified = isVerified === 'true'

        if(isActive !== undefined) updatedFields.isActive = isActive === 'true'

        if(isBlocked !== undefined) updatedFields.isBlocked = isBlocked === 'true' 

        await User.findByIdAndUpdate(
            user_ID, 
            updatedFields)
             
        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// block or unblock user

export const toggleUserBlock = async (req,res) => {
    
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);

        if(!user) return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        user.isBlocked = !user.isBlocked;
        await user.save();

        const message = user.isBlocked ? STRING_CONSTANTS.BLOCKED : STRING_CONSTANTS.UNBLOCKED;
        return ResponseHandler.success(res, message, HttpStatus.OK);


    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// delete user

export const deleteUser = async (req,res) => {
    
    try {
        
        const user_ID = req.params.id

        const user = await User.findById(user_ID)
        if(!user) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        await User.findByIdAndDelete(user_ID)

        return ResponseHandler.success(res,STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.DELETION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}