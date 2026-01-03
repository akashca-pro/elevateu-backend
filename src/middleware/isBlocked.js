import Admin from "../model/admin.js";
import Tutor from "../model/tutor.js";
import User from "../model/user.js";
import ResponseHandler from "../utils/responseHandler.js";
import HttpStatus from "../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../utils/stringConstants.js";

const roleModels = {
    user : User,
    tutor : Tutor,
    admin : Admin
}

export const isBlocked = (role) => async (req,res,next) => {
    
    try {
        const Model = roleModels[role]
        const id = req[role].id;
        const user = await Model.findById(id)
        if(!user)
            return ResponseHandler.error(res, STRING_CONSTANTS.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(user.isBlocked)
            return ResponseHandler.error(res, STRING_CONSTANTS.BLOCKED, HttpStatus.FORBIDDEN); 

        next()

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER, error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}