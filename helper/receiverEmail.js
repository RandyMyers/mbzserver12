const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const Receiver = require('../models/receiver');
const moment = require('moment');
const Email = require('../models/emails');
const Inbox = require('../models/inbox');
const EmailLogs = require('../models/emailLogs');

const receiverEmails = async (receiverId) => {
  try {
    // Fetch receiver details
    const receiver = await Receiver.findById(receiverId);

    if (!receiver || !receiver.isActive) {
      throw new Error('Receiver email is not active or not found.');
    }

    // IMAP configuration
    const config = {
      imap: {
        user: receiver.username,
        password: receiver.password,
        host: receiver.imapHost,
        port: receiver.imapPort,
        tls: receiver.useTLS,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    // Connect to the IMAP server
    const connection = await imaps.connect(config);

    // Open the INBOX
    await connection.openBox('INBOX');

    // Fetch unseen emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true,
    };

    const results = await connection.search(searchCriteria, fetchOptions);

    // Loop through the emails and save them
    for (const email of results) {
      const header = email.parts.find((part) => part.which === 'HEADER');
      const body = email.parts.find((part) => part.which === '');

      // Parse the email with `simpleParser`
      const parsedEmail = await simpleParser(body.body);

      const emailData = {
        recipient: receiver.email,
        sender: parsedEmail.from ? parsedEmail.from.text : 'Unknown Sender',
        subject: parsedEmail.subject || 'No Subject',
        body: parsedEmail.html || parsedEmail.text || '', // Use HTML if available, fallback to plain text
        createdAt: moment(header.date).toDate(),
        organization: receiver.organization,
        user: receiver.userId,
        messageId: parsedEmail.messageId, // Save the incoming email's Message-ID
      };

      if (receiver.organization) {
        emailData.organization = receiver.organization;
      }

      console.log(emailData);

      // Save the email to the database
      const newEmail = new Inbox(emailData);
      await newEmail.save();

      // Create an EmailLog entry
      const emailLog = new EmailLogs({
        emailId: newEmail._id,
        status: 'received',
        receivedAt: new Date(),
      });

      await emailLog.save();

      // Link the log to the email
      newEmail.emailLogs.push(emailLog._id);
      await newEmail.save();
    }

    // Close the IMAP connection
    connection.end();

    console.log('All emails fetched successfully.');
  } catch (error) {
    console.error('Error fetching emails:', error.message);
    throw new Error('Failed to fetch emails');
  }
};

module.exports = receiverEmails;
