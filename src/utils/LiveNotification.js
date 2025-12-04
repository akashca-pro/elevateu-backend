import Notification from "../model/notification.js"
import { connectedUsers } from "../services/socketServer.js"

export const saveNotification = async (recipientId, recipientType, type, message, senderId=null, senderType=null) => {
    
    try {
        const newNotification = await Notification.create({
            recipientId,
            recipientType ,
            senderId ,
            senderType ,
            type ,
            message
        })
        return newNotification

    } catch (error) {
        throw new Error('Error saving notification')
    }

}

export const sendNotification = (req,newNotification) =>{

    if(connectedUsers[newNotification.recipientId]){
        const socketId = connectedUsers[newNotification.recipientId].socketId;
        req.io.to(socketId).emit('newNotification',newNotification);
    }

}