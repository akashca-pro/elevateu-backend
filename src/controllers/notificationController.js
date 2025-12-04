import Notification from "../model/notification.js";
import ResponseHandler from "../utils/responseHandler.js";
import HttpStatus from "../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../utils/stringConstants.js";

export const loadNotifications = (role) => async(req,res) => {

    try {
        const id = req[role].id;
        const notifications = await Notification.find({ recipientId : id , isRead : false })
        .select('type message createdAt isRead ')

        if(!notifications)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)
        
        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, notifications)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

} 

// mark as read 

export const readNotifications = async (req,res) => {
    
    try {
        const { notification_id } = req.body
        if(Array.isArray(notification_id)){
            if(!notification_id || notification_id.length === 0)
                return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.NOT_FOUND)
            
            await Notification.updateMany({ _id : {$in : notification_id} } , { $set : { isRead : true } })

            return ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS,HttpStatus.OK)
        }

        const notification = await Notification.findOneAndUpdate(
            { _id : notification_id },
            {$set : { isRead : true } },
            {new : true});

        if(!notification)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND)

        return ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)
        

    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error)
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
