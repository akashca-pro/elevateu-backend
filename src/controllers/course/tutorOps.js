import Course from '../../model/course.js'
import Tutor from '../../model/tutor.js'
import Admin from '../../model/admin.js'
import ResponseHandler from '../../utils/responseHandler.js'
import HttpStatus from '../../utils/statusCodes.js'
import { STRING_CONSTANTS } from '../../utils/stringConstants.js'
import { saveNotification, sendNotification } from '../../utils/LiveNotification.js'
import EnrolledCourse from '../../model/enrolledCourses.js'

// create a course
export const createCourse = async (req,res) => {
    
    try {
        const {formData, draft} = req.body
        const tutorId = req.tutor.id

        const tutorCheck = await Tutor.findById(tutorId)
        if(!tutorCheck) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const titleExist = await Course.findOne({title : formData.title , tutor : tutorId})
        if(titleExist)
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT)

        if(tutorCheck.draftCount >= 3 && draft)
            return ResponseHandler.error(res, STRING_CONSTANTS.DRAFT_LIMIT, HttpStatus.TOO_MANY_REQUESTS);
        
        const incompleteModule = formData.modules.some(module => {
            // If module title is missing, it's incomplete
            if (!module.title.trim()) return true;
          
            // If no lessons present, it's incomplete
            if (!Array.isArray(module.lessons) || module.lessons.length === 0) return true;
          
            // If any lesson is missing title or videoUrl, it's incomplete
            const hasInvalidLesson = module.lessons.some(lesson => 
              !lesson.title?.trim() || !lesson.videoUrl?.trim()
            );
          
            return hasInvalidLesson;
          });
    
          if(incompleteModule)
            return ResponseHandler.error(res, 'Atleast one module is required,modules should be completed',HttpStatus.BAD_REQUEST)


        await Tutor.findByIdAndUpdate(
            tutorId,
            { $inc: { courseCount: 1 } },
        );

        await Course.create({
            ...formData,
            title : formData.title.trim(),
            tutor : tutorId,
            draft : draft ? true : false,
            status : !draft ? 'pending' : 'draft',
        });


        return ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.CREATED)

    } catch (error) {
        console.log(STRING_CONSTANTS.CREATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.CREATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, error)
    }

}

// view all uploaded courses

export const loadCourses = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        const {search, filter} = req.query

        let sort = { createdAt: -1 }; // Default sorting (Newest first)
        let filterQuery = {tutor : tutorId, isArchive : false}; 

        if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
        } else if (filter === "Draft") {
            filterQuery.status = 'draft'
        } else if (filter === "active") {
            filterQuery.status = 'approved';
        }

        if (search) {
            filterQuery.title =  { $regex: search, $options: "i" } 
        }   

        const totalCourse = await Course.countDocuments(filterQuery);

        const course = await Course.find(filterQuery)
        .skip(skip)
        .limit(limit)
        .sort(sort)

        if(!course || course.length === 0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.OK)

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, {
            courses : course,
            total: totalCourse, 
            currentPage: page,
            totalPages: Math.ceil(totalCourse / limit),
        })
            
    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// view specific course

export const courseDetails = async (req,res) => {
    
    try {
        const courseId = req.params.id
        const tutorId = req.tutor.id
     
        const courseDetails = await Course.findOne({_id : courseId , tutor : tutorId})
        if(!courseDetails) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, courseDetails)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// update course

export const updateCourse = async (req, res) => {
    try {
      const { formData } = req.body;
      const tutorId = req.tutor.id
      const courseId = formData._id
      formData.isPublished = false
      formData.draft = true
      formData.status = 'draft'

      const course = await Course.findOne({_id : courseId , tutor : tutorId});
      if (!course) 
        return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);


      const incompleteModule = formData.modules.some(module => {
        // If module title is missing, it's incomplete
        if (!module.title.trim()) return true;
      
        // If no lessons present, it's incomplete
        if (!Array.isArray(module.lessons) || module.lessons.length === 0) return true;
      
        // If any lesson is missing title or videoUrl, it's incomplete
        const hasInvalidLesson = module.lessons.some(lesson => 
          !lesson.title?.trim() || !lesson.videoUrl?.trim()
        );
      
        return hasInvalidLesson;
      });

      if(incompleteModule)
        return ResponseHandler.error(res, 'Modules should be completed',HttpStatus.BAD_REQUEST)

      await Course.findOneAndUpdate({ _id : courseId},formData);
  
      return ResponseHandler.success(res,STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,error)
    }
};
  
// publish course

export const requestPublish = async (req, res) => {
    try {
        const tutorId = req.tutor.id;
        const { courseDetails } = req.body;
        
        const titleExist = await Course.findOne({  _id: {$ne : courseDetails._id},
            tutor: tutorId,
            title : courseDetails.title  })
        
        if(titleExist)
            return ResponseHandler.error(res,'Title already exist for another course',HttpStatus.CONFLICT)

        // Find course owned by tutor
        const course = await Course.findOne({ _id: courseDetails._id, tutor: tutorId }).populate('tutor', 'firstName email')

        if (!course) {
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if (course.isPublished || course.status === "approved") {
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);
        }

        if(course.status === 'suspended') {
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_SUSPENDED, HttpStatus.NOT_ACCEPTABLE);
        }

        const adminId = await Admin.findOne()

        course.status = "pending";
        course.draft = false;
        await course.save();

        const newNotification = await saveNotification(adminId._id, 'Admin', 'publish_request', `Course publish request recieved from ${course?.tutor?.firstName} , email : ${course?.tutor?.email}`)

        sendNotification(req, newNotification)

        return ResponseHandler.success(res, "Course publish request submitted. It will be reviewed before publishing.", HttpStatus.OK);

    } catch (error) {
        console.error(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

// delete course 

export const deleteCourse = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id
        const courseId = req.params.id

        const course = await Course.findOne({_id : courseId , tutor : tutorId});

        if(!course) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        await Tutor.findByIdAndUpdate(tutorId, { $inc : { courseCount : -1 } })
        
        const isCourseEnrolled = await EnrolledCourse.findOne({ courseId })
        
        if(isCourseEnrolled){
            await Course.findByIdAndUpdate(courseId, { $set : { isArchive : true , isPublished : false } })
            return ResponseHandler.success(res, STRING_CONSTANTS.DELETION_SUCCESS,HttpStatus.OK)
        }

        await Course.findByIdAndDelete(courseId);

        return ResponseHandler.success(res, STRING_CONSTANTS.DELETION_SUCCESS,HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR, error);
        return ResponseHandler.error(res,STRING_CONSTANTS.DELETION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Title already exist 

export const courseTitleExist = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id;
        const {title} = req.query

        const titleExist = await Course.findOne({
            tutor: tutorId,
            title: { $regex: `^${title}$`, $options: 'i' }
          });
        
        if(titleExist && titleExist.title.toLowerCase() === title.toLowerCase())
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT)

        return ResponseHandler.success(res, undefined, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.EXIST, error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}
