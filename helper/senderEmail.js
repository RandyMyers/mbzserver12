const nodemailer = require('nodemailer');
const Sender = require('../models/sender');
const Email = require('../models/emails');
const EmailLogs = require('../models/emailLogs'); // Import the EmailLogs model

const sendEmail = async ({ senderId, campaign, workflow, organization, createdBy, emailTemplate, variables, to, subject, text, html }) => {
  try {
    // Fetch the sender details
    const sender = await Sender.findById(senderId);

    if (!sender || !sender.isActive) {
      throw new Error('Sender email is not active or not found.');
    }

    // Create the Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpPort === 465, // true if port is 465
      auth: {
        user: sender.username,
        pass: sender.password,
      },
    });

    // Send the email
    const info = await transporter.sendMail({
      from: sender.email, // Use sender email if 'from' is not specified
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent: %s', info.messageId); // Log the success

    // Save the email data in the Email collection
    const emailData = {
      recipient: to,
      subject,
      body: text || html, // Store the email body (use HTML if available)
      variables,
      emailTemplate,
      campaign,
      workflow,
      createdBy,
      organization,
      messageId: info.messageId,
      status: 'sent'
    };

    const newEmail = new Email(emailData);
    await newEmail.save(); // Save the email data

    console.log('Email saved to database: %s', newEmail._id); // Log the saved email ID

    // Create an EmailLog entry
    const emailLog = new EmailLogs({
      emailId: newEmail._id,
      status: 'sent',
      sentAt: new Date(),
    });

    await emailLog.save(); // Save the email log

    // Update Email document to reference the created log
    newEmail.emailLogs.push(emailLog._id);
    await newEmail.save(); // Save the updated Email document

    console.log('Email log saved with status sent');

    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);

    // Save the failed email to the Email collection
    const emailData = {
      recipient: to,
      subject,
      body: text || html,
      status: 'failed',
      errorMessage: error.message, // Capture the error message
      createdBy,
      organization,
    };

    const failedEmail = new Email(emailData);
    await failedEmail.save(); // Save the failed email

    // Create an EmailLog entry for the failed attempt
    const emailLog = new EmailLogs({
      emailId: failedEmail._id,
      status: 'failed',
      errorMessage: error.message,
      sentAt: new Date(),
    });

    await emailLog.save(); // Save the failed email log

    // Update the failed Email document to reference the created log
    failedEmail.emailLogs.push(emailLog._id);
    await failedEmail.save(); // Save the updated Email document

    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
