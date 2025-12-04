import Certificate from "../../model/certificate.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js"

export const loadCertificates = async (req,res) => {
    
    try {
        const userId = req.user.id
        const page = parseInt(req.query.page) || 1
        const limit = 6
        const skip = (page-1) * limit
        const {searchQuery} = req.query

        let filterQuery = { 'user.id' : userId };
        
        if(searchQuery){
            const regex = new RegExp(searchQuery,'i');

            filterQuery = {
                $or : [
                    { "course.title": regex },
                    { "tutor.name": regex },
                    { "course.level" : regex }
                ]
            }
        }

        const totalCertificates = await Certificate.countDocuments(filterQuery);

        const certificates = await Certificate.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const response = certificates.map(c=>{
            return {
                id: c._id,
                userName : c.user.name,
                courseId : c.course.id,
                courseName: c.course.title,
                tutorName: c.tutor.name,
                tutorExpertise : c.tutor.expertise,
                completionDate: c.createdAt,
                difficulty: c.course.level,
                duration: c.course.duration,
            }
        })

        return ResponseHandler.success(res, STRING_CONSTANTS.LOAD_CERTIFICATES_SUCCESS, HttpStatus.OK,{
            certificates : response,
            total: totalCertificates, 
            currentPage: page,
            totalPages: Math.ceil(totalCertificates / limit),
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}