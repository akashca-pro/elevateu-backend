import Category from "../../model/category.js";
import Course from "../../model/course.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";
import { saveNotification ,sendNotification } from '../../utils/LiveNotification.js'
import Tutor from "../../model/tutor.js";

// view all courses

export const loadCourses = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        const {search, filter} = req.query

        let sort = { createdAt: -1 }; // Default sorting (Newest first)
        let filterQuery = {}; 

                // Handle filter conditions
                if (filter === "oldest") {
                    sort = { createdAt: 1 }; // Oldest first
                } else if (filter === "active") {
                    filterQuery.isPublished = true;
                } else if (filter === "Not-Active") {
                    filterQuery.isPublished = false;
                }

                if (search) {
                    filterQuery.title = { $regex : search , $options : "i"  }                 
                }      
        
        const courses = await Course.find(filterQuery)
        .select(`title category categoryName tutor price duration discount totalEnrollment thumbnail isPublished
            status rating level badge hasCertification modules createdAt isSuspended`)
        .populate('tutor' , 'firstName email profileImage')
        .populate({
            path: 'modules',
            select: 'title lessons', 
            populate: {
                path: 'lessons', 
                select: 'title ' 
            }
        })
        .skip(skip)
        .limit(limit)
        .sort(sort)

        const modulesCount = courses.map((course)=>({
            _id : course._id,
            Count : course.modules.length
        }))

        const totalCourses = await Course.countDocuments(filterQuery)

        if(!courses || courses.length === 0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK,{
            courses,
            modulesCount ,
            total: totalCourses, 
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR,error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Suspend Course 

export const allowOrSuspendCourse = async (req,res) => {
    
    try {
        const { courseId, tutorId } = req.body

        const course = await Course.findById(courseId)
        
        if(!course)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(course.isSuspended){
            course.status = 'draft';
            course.isSuspended = false;

            await course.save()

            const newNotification = await saveNotification(tutorId, 'Tutor', 'suspension_removed',
                `Suspension has removed from your course ${course.title}. You can now initiate publish request `
             )
    
             sendNotification(req,newNotification)

             return ResponseHandler.success(res, STRING_CONSTANTS.COURSE_ACTIVE,HttpStatus.OK)
        }

        if(course.status === 'approved'){
            course.isPublished = false;
            course.isSuspended = true;
            course.status = 'suspended'

            await course.save()

            const newNotification = await saveNotification(tutorId, 'Tutor', 'suspend_course',
                `Your ${course.title} course has been suspended `
             )
    
             sendNotification(req,newNotification)
            
             return ResponseHandler.success(res, STRING_CONSTANTS.COURSE_SUSPENDED,HttpStatus.OK)
        }

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// view pending requests

export const loadPendingRequest = async (req,res) => {
    
    try {
        const request = await Course.find({status : 'pending'})
        .populate('tutor','_id firstName lastName email profileImage')
        .populate('category','name')
        .select('_id title tutor category thumbnail description createdAt modules price isFree level')

        if(!request||request.length === 0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.OK);

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, request);

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// approve or reject course publication

export const approveOrRejectCourse = async (req,res) => {
    
    try {
        const {id, input, reason} = req.body

        const courseId = id.courseId;
        const tutorId = id.tutorId;

        const course = await Course.findOne({_id : courseId , tutor : tutorId})

        if(!course) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(course.status === 'approved' || course.status === 'rejected' ) 
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);
        
        if(input === 'approve'){

            const totalDuration = course.modules.reduce((moduleAcc, module) => {
                const moduleDuration = module.lessons.reduce((lessonAcc, lesson) => {
                    return lessonAcc + lesson.duration;
                }, 0);
                return moduleAcc + moduleDuration;
                }, 0);

            await Course.findByIdAndUpdate(courseId,{
                status : 'approved',
                duration : totalDuration,
                reason,
                isPublished : true
            })

            await Tutor.findByIdAndUpdate(tutorId, { $inc : { courseCount : 1 } });

             const newNotification = await saveNotification(tutorId, 'Tutor', 'course_approved',
                `Congrats your ${course.title} course has been verified and published,${reason}`
             )
 
             sendNotification(req,newNotification)

            return ResponseHandler.success(res,`Verification approved for ${course?.title}`,HttpStatus.OK)
        } 
        else if(input === 'reject') {
            await Course.findByIdAndUpdate(courseId,{status : 'rejected' , reason})

            const newNotification = await saveNotification(tutorId, 'Tutor', 'course_rejected',
               `Sorry ${course.title} course has been rejected,${reason}`
             )

             sendNotification(req,newNotification)
            
            return ResponseHandler.success(res,`Verification rejected for  ${course?.title}`,HttpStatus.OK)
        }   
        else return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_INPUT, HttpStatus.BAD_REQUEST);

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// delete course 

export const deleteCourse = async (req,res) => {
    
    try {
        const course_Id = req.params.id

        const course = await Course.findById(course_Id)
        if(!course)  
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        await Course.findByIdAndDelete(course_Id)

        return ResponseHandler.success(res,STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.DELETION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Assign course to category

export const assignCategory = async (req,res) => {
    
    try {
        const { courseId, categoryId } = req.body

        const course = await Course.findById(courseId)
        if(!course) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const category = await Category.findById(categoryId)
        if(!category) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        course.category = categoryId

        await course.save()

        return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}