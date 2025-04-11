const cron = require('node-cron');
const Receiver = require('../models/receiver');
const receiverEmails = require('./receiverEmail'); // Update with the correct path

// Schedule the cron job to run every minute (you can adjust the cron expression as needed)
exports.scheduleReceiverEmails = () => {
  cron.schedule('* * * * *', async () => {
    try {
      //console.log('Fetching emails...');

      // Get all active receivers (or use specific receiverId if needed)
      const receivers = await Receiver.find({ isActive: true });

      if (receivers.length === 0) {
        //console.log('No active receivers found.');
        return; // Exit if no receivers are found
      }

      // Loop through each receiver and fetch their emails
      for (const receiver of receivers) {
        await receiverEmails(receiver._id); // Call receiverEmails with receiverId
      }

      //console.log('Emails fetched successfully.');
    } catch (error) {
      console.error('Error fetching emails through cron job:', error.message);
    }
  });
};
