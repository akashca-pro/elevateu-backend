import cron from 'node-cron'
import Notification from '../model/notification.js'

// Cron schedule: runs every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {

    try {
        console.log('Running cron job to delete read messages older than 24h...');

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await Notification.deleteMany({
            isRead : true,
            readAt : { $lt : twentyFourHoursAgo },
        })

        console.log(`Deleted ${result.deletedCount} messages read over 24h ago`);

    } catch (error) {
        console.error('Error deleting read messages:', error.message);
    }

})