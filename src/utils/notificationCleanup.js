import cron from 'node-cron'
import Notification from '../model/notification.js'

cron.schedule('0 * * * *',async () => {
    
    try {
        console.log('Running notification cleanup job...')

        const now = new Date()

        await Notification.deleteMany({
            isRead : true , readAt : { $lt : new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        })

    } catch (error) {
        console.log('Error deleting notification',error)
    }

})