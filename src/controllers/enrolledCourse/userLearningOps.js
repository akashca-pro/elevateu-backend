import Certificate from "../../model/certificate.js";
import Course from "../../model/course.js";
import EnrolledCourse from "../../model/enrolledCourses.js";
import ProgressTracker from "../../model/progressTracker.js";
import User from "../../model/user.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js"

const calculateProgress = (modules) => {
    if (!modules || modules.length === 0) return 0;

    let totalLessons = 0;
    let completedLessons = 0;

    for (const module of modules) {
        if(module.isAddon){
            continue;
        }
        for (const lesson of module.lessons) {
            if(lesson.isAddon){
                continue;
            }
            totalLessons++;
            if (lesson.isCompleted) completedLessons++;
        }
    }

    return totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
};

// Dynamically convert modules into cumulative array based on level to figure out the user's level

export const calculateLevelSize = (modules) => {
 
    const totalModules = modules.length || 0;
    const levels = 5;
    
    // Step 1: Calculate base size and remainder
    const base = Math.floor(totalModules / levels);
    const remainder = totalModules % levels;
    
    // Step 2: Determine modules per level
    const modulesPerLevel = [];
    for (let i = 0; i < levels; i++) {
      if (i < remainder) {
        modulesPerLevel.push(base + 1); // First 'remainder' levels get an extra module
      } else {
        modulesPerLevel.push(base); // Remaining levels get the base number
      }
    }
    
    // Step 3: Calculate cumulative modules to complete each level
    const cumulativeModules = modulesPerLevel.reduce((acc, curr, index) => {
      if (index === 0) {
        acc.push(curr);
      } else {
        acc.push(acc[index - 1] + curr);
      }
      return acc;
    }, []);
    

    const completedModules = modules.filter(m => m.isCompleted).length || 0;
    const completedLevels = cumulativeModules.filter(cum => completedModules >= cum).length || 0;
    
    let currentLevel;
    if (completedModules >= totalModules) {
      currentLevel = 5; // All levels completed
    } else {
      currentLevel = completedLevels; // Current level being worked on
    }

    return { cumulativeModules, currentLevel }
} 

// check course is enrolled

export const isCourseEnrolled = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        const isEnrolled = await EnrolledCourse.findOne({ userId, courseId });

        if(isEnrolled) 
            return ResponseHandler.success(res, STRING_CONSTANTS.COURSE_IS_ENROLLED, HttpStatus.OK);

        return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_NOT_ENROLLED, HttpStatus.BAD_REQUEST)

    } catch (error) {
        console.log(STRING_CONSTANTS.PROGRESS_TRACKER_UPDATED_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.OK);
    }

}

// update progress tracker only when tutor add module or lessons in existing module

export const updateProgressTracker = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        const isEnrolled = await EnrolledCourse.findOne({ userId, courseId })

        if(!isEnrolled)
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_NOT_ENROLLED, HttpStatus.NOT_FOUND);

        const progressTracker = await ProgressTracker.findOne({ userId , courseId });

        if(!progressTracker)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.NO_CONTENT)

        const course = await Course.findById(courseId).select("modules updatedAt");

        if (!course) 
            return ResponseHandler.error(res, STRING_CONSTANTS.COURSE_NOT_FOUND, HttpStatus.NOT_FOUND);

        let courseProgressUpdated = false;

        // If the course has been updated after last update, check for new modules or lessons
        if (!progressTracker.lastCourseUpdate || progressTracker.lastCourseUpdate < course.updatedAt) {
            progressTracker.lastCourseUpdate = new Date(course.updatedAt);

            // Convert modules to a map for quick lookup
            const progressModulesMap = new Map(progressTracker.modules.map(m => [m.moduleId, m]));

            courseProgressUpdated = false;

            // Iterate over course modules
            for (const courseModule of course.modules) {
                if (!progressModulesMap.has(courseModule._id)) {
                    //  New module found → Add to progress tracker
                    progressTracker.modules.push({
                        moduleId: courseModule._id,
                        moduleTitle: courseModule.title,
                        moduleProgress: 0,
                        lessons: courseModule.lessons.map(lesson => ({
                            lessonId: lesson._id,
                            lessonTitle: lesson.title,
                            isCompleted: false,
                            isAddon : true
                        })),
                        isCompleted: false,
                        isAddon : true
                    });

                    courseProgressUpdated = true;
                }
            }
            if(courseProgressUpdated){
                await progressTracker.save()
            }
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.PROGRESS_TRACKER_UPDATED_SUCCESS,HttpStatus.OK,courseProgressUpdated);

    } catch (error) {
        console.log(STRING_CONSTANTS.PROGRESS_TRACKER_UPDATED_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER,HttpStatus.OK);
    }

}

// load course and module details that are available when enrolled

export const courseDetails = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        const isEnrolled = await EnrolledCourse.findOne({ userId, courseId });

        if(!isEnrolled)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const courseDetails = await Course.findById(courseId)
        .populate('tutor','firstName lastName profileImage bio expertise experience socialLinks')
        
        if(!courseDetails)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);
        
        const progressTracker = await ProgressTracker.findOne({ userId, courseId })
        
        if(!progressTracker)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        const allAttachments = courseDetails.modules.flatMap((module,moduleIndex)=>{
           return module.lessons.flatMap((lesson,lessonIndex)=>{

            const attachments = lesson.attachments.flatMap(ats=>{
                return {
                    title : ats.title,
                    link : ats.link,
                    fileType : ats.link.split('.').pop()
                }
            })

            return {
                moduleId : moduleIndex + 1,
                lessonId : lessonIndex + 1,
                moduleTitle : module.title,
                lessonTitle : lesson.title,
                attachments
            }
           })
        })

        const flattenedData = allAttachments.flatMap(({ moduleId, lessonId, moduleTitle, lessonTitle, attachments }) =>
            attachments.map(({ title, link, fileType }) => ({
              moduleId,
              lessonId,
              moduleTitle,
              lessonTitle,
              title,
              link,
              fileType
            }))
          );
        
            const enrolledModules = [];
            const addOnModules = [];

            courseDetails.modules.forEach((module, index) => {
            const moduleInstance = progressTracker.modules.find(m => m.moduleId === module._id);
            const totalLessons = module.lessons.length;
            const completedLessons = moduleInstance?.lessons
                .filter(les => les.isCompleted)
                .map(les => les.lessonId) || [];

            const moduleData = {
                _id: module._id,
                title: module.title,
                totalLessons,
                lessonDetails: module.lessons.map((lesson) => ({
                _id: lesson._id,
                title: lesson.title,
                duration: lesson.duration,
                completedLessons
                })),
            };

            if (progressTracker.modules[index]?.isAddon) {
                addOnModules.push(moduleData);
            } else {
                enrolledModules.push(moduleData);
            }
            });


        const totalLessons = enrolledModules.reduce((total,module)=>{
            return total + module.totalLessons
        },0)

        const responseData = {
            courseDetails : {
                _id : courseDetails._id,
                title : courseDetails.title,
                description : courseDetails.description,
                tutor : courseDetails.tutor,
                attachments : flattenedData,
                totalModules : courseDetails.modules.length || 0,
                totalLessons 
            },
            enrolledModules,
            addOnModules
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.SUCCESS,HttpStatus.OK,responseData)

    } catch (error) {
        console.log(STRING_CONSTANTS.COURSE_DETAILS_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// load current progress Status

export const progressStatus = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id;

        const progressTracker = await ProgressTracker.findOne({ userId, courseId })

        if(!progressTracker)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);

        let totalLessons;

        const currentModuleStatus = () => {
            const currentModule = progressTracker.modules.find(module => (!module.isCompleted && !module.isAddon) );
        
            if (!currentModule) return {
                 currentModule: progressTracker.modules[0], 
                 currentLesson: progressTracker.modules[0].lessons[0], 
                 moduleProgress: 100 };

            totalLessons = currentModule.lessons.length;
            const completedLessons = currentModule.lessons.filter(lesson=>lesson.isCompleted).length

            const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
            const currentLesson = currentModule.lessons.find(lesson => !lesson.isCompleted);

            return {
                currentModule,
                currentLesson,
                moduleProgress,
                completedLessons
            };
        };

        const { currentModule, currentLesson, moduleProgress, 
            completedLessons

         } = currentModuleStatus();

        const completedModules = progressTracker.modules.map(m=>{
            if(m.isCompleted){
                return m.moduleId
            }
        })

        const courseProgress = calculateProgress(progressTracker.modules)

        await EnrolledCourse.findOneAndUpdate({ userId, courseId },
            { $set : { courseProgress, isCompleted : courseProgress === 100  } })

        const moduleIndex = progressTracker.modules.findIndex(m=>m.moduleId === currentModule.moduleId)

        let upcomingModule = null;

        if (moduleIndex !== -1 && moduleIndex + 1 < progressTracker.modules.length) {
            upcomingModule = progressTracker.modules[moduleIndex + 1];
        }

        const lessonData = await Course.aggregate([
            { $match: { _id: courseId } },
            { $unwind: "$modules" },
            { $match: { "modules._id": currentModule.moduleId } },
            { $unwind: "$modules.lessons" },
            { $match: { "modules.lessons._id": currentLesson.lessonId } },
            { $replaceRoot: { newRoot: "$modules.lessons" } } 
        ]);

        const attachments = lessonData[0].attachments.map(ats=> {
            return {
                moduleId : moduleIndex + 1,
                lessonId : progressTracker.modules[moduleIndex].lessons.findIndex(les=>les.lessonId === lessonData[0]._id) + 1,
                moduleTitle : currentModule.moduleTitle,
                lessonTitle : currentLesson.lessonTitle,
                title : ats.title,
                link : ats.link,
                fileType : ats.link.split('.').pop()
            }
        })

        const finalLessonData = {
            ...lessonData[0],
            attachments,
            isCompleted : currentLesson.isCompleted,
            moduleId : currentModule.moduleId,
            isAddon : currentLesson.isAddon
        }

        const totalModules = progressTracker.modules.length || 0
 
        const currentProgress = {
            currentModule,
            upcomingModule : {
                _id : upcomingModule ? upcomingModule.moduleId : null ,  
                title : upcomingModule ? upcomingModule.moduleTitle : null
            },
            currentLesson : finalLessonData,
            moduleProgress,
            courseProgress,
            currentLevel : courseProgress === 100 ? 5 : progressTracker.level.currentLevel,
            totalLessons,
            completedModules,
            totalModules,
            completedLessons
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.PROGRESS_STATUS_SUCCESS, HttpStatus.OK,currentProgress);

    } catch (error) {
        console.log(STRING_CONSTANTS.PROGRESS_STATUS_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// update lesson or module completion

export const changeLessonOrModuleStatus = async (req,res) => {
    
    try {
        const userId = req.user.id;

        const { lessonId, moduleId, courseId } = req.body
        
        const progressTracker = await ProgressTracker.findOne({ userId, courseId });

        if(!progressTracker || !lessonId)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const alreadyUpdated = await ProgressTracker.findOne({
            userId, 
            courseId, 
            "modules.moduleId": moduleId, 
            "modules.lessons": {
                $elemMatch: {
                    lessonId: lessonId,
                    isCompleted: true  
                }
            }
        });

        if(alreadyUpdated){
            return ResponseHandler.success(res, STRING_CONSTANTS.EXIST, HttpStatus.ALREADY_REPORTED);
        }

        const updatedProgress = await ProgressTracker.findOneAndUpdate(
            { userId, courseId, "modules.moduleId": moduleId, "modules.lessons.lessonId": lessonId },
            { $set: { "modules.$.lessons.$[les].isCompleted": true } }, 
            {
                arrayFilters: [
                    { "les.lessonId": lessonId } 
                ],
                new: true
            }
        );


        if(!updatedProgress)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const moduleIndex = updatedProgress.modules.findIndex((m)=>m.moduleId === moduleId)

        if(moduleIndex !== -1){
            const module = updatedProgress.modules[moduleIndex];
            
            const allLessonsCompleted = module.lessons.every(lesson=> lesson.isCompleted)

            if(allLessonsCompleted){
                updatedProgress.modules[moduleIndex].isCompleted = true;

                const { cumulativeModules, currentLevel } = 
                calculateLevelSize(updatedProgress.modules.filter(m=>!m.isAddon))
        
                updatedProgress.level={
                    currentLevel,
                    cumulativeModules
                }
            }

        }else{
            throw new Error('Failed finding module index')
        }

        await updatedProgress.save()

        // Create certificate when all modules are completed

        const allModulesCompleted = updatedProgress.modules.every(m => (m.isCompleted && !m.isAddon));

        if(allModulesCompleted && updatedProgress.resetCount === 0 ){

        const course = await Course.findById(courseId)
        .select('title tutor duration level categoryName')
        .populate('tutor',' _id firstName email')

        const user = await User.findById(userId)
        .select('firstName email')

        const alreadyExist = await Certificate.findOne({ 'user.id' : userId , 'course.id' : courseId})

        if(!alreadyExist){

            await Certificate.create({
                user : {
                    id : userId,
                    name : user.firstName,
                    email : user.email
                },
                tutor : {
                    id : course.tutor._id,
                    name : course.tutor.firstName,
                    email : course.tutor.email,
                    expertise : course.categoryName
                },
                course : {
                    id : course._id,
                    title : course.title,
                    duration : course.duration,
                    level : course.level
                }
            })

        } 

        }

        return ResponseHandler.success(res, STRING_CONSTANTS.PROGRESS_CHANGE_LESSON_STATUS_SUCCESS, HttpStatus.OK,updatedProgress)

    } catch (error) {
        console.log(STRING_CONSTANTS.PROGRESS_CHANGE_LESSON_STATUS_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// load selected lesson

export const loadSelectedLesson = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const {courseId, lessonId, moduleId} = req.query

        if(!courseId || !lessonId || !moduleId)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const isEnrolled = await EnrolledCourse.findOne({ courseId, userId })

        if(!isEnrolled)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);
        
        const lessonData = await Course.aggregate([
            { $match : { _id : courseId } },
            { $unwind : '$modules' },
            { $match  : { 'modules._id' : moduleId } },
            { $unwind : '$modules.lessons' },
            { $match : { 'modules.lessons._id' : lessonId } },
            { $project : { _id : 0, lesson : '$modules.lessons' } }
        ]);

          const progressTracker = await ProgressTracker.findOne({userId , courseId})

          const module = progressTracker.modules.find(m=>m.moduleId===moduleId)
          const lesson = module.lessons.find(les=>les.lessonId === lessonId)

          const moduleIndex = progressTracker.modules.findIndex(m=>m.moduleId===moduleId)
          const lessonIndex = module.lessons.findIndex(les=>les.lessonId===lessonId)

          const attachments = lessonData[0].lesson.attachments.map(ats=> {
            return {
                moduleId : moduleIndex + 1, 
                lessonId : lessonIndex + 1,
                moduleTitle : module.moduleTitle,
                lessonTitle : lesson.lessonTitle,
                title : ats.title,
                link : ats.link,
                fileType : ats.link.split('.').pop()
            } 
        })

        if(!lessonData || lessonData.length === 0 )
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT)

        const result = {
            ...lessonData[0].lesson,
            attachments,
            moduleId,
            isCompleted : lesson.isCompleted,
            isAddon : lesson.isAddon
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_CURRENT_LESSON_SUCCESS, HttpStatus.OK,result)        

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_CURRENT_LESSON_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// progress reset

export const resetCourseProgress = async (req,res) => {
    
    try {
        const userId = req.user.id;
        const courseId = req.params.id

        const progressTracker = await ProgressTracker.findOne({ userId, courseId })

        if (!progressTracker) {
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        progressTracker.modules.forEach((module) => {
            if (!module.isAddon) { 
              module.lessons.forEach((lesson) => {
                lesson.isCompleted = false;
              });
              module.isCompleted = false;
            }
          });
      
        progressTracker.level.currentLevel = 1;

        progressTracker.resetCount += 1;

        await progressTracker.save()  

        return ResponseHandler.success(res, STRING_CONSTANTS.COURSE_PROGRESS_RESET_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.COURSE_PROGRESS_RESET_ERROR,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}