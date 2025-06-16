const Campaign = require('../models/campaigns');
const Customer = require('../models/customers');
const Organization = require('../models/organization');
const EmailTemplate = require('../models/emailTemplate');  // Fixed typo
const Sender = require('../models/sender');
const CampaignLog = require('../models/campaignLogs');
const sendEmail = require('../helper/senderEmail');
const mongoose = require("mongoose");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const EmailLogs = require('../models/emailLogs');
const logEvent = require('../helper/logEvent');

const dotenv = require('dotenv');
dotenv.config();

// Helper function to replace placeholders in the template with actual data
const replacePlaceholders = (template, contact) => {
  console.log(template, contact);
  return template
    .replace('{{firstName}}', contact.firstName)
    .replace('{{lastName}}', contact.lastName)
    .replace('{{email}}', contact.email)
    .replace('{{country}}', contact.country || '') // Optional fallback for undefined values
    .replace('{{language}}', contact.language || 'en'); // Fallback to 'en' if no language is provided
};

const BASE_URL = process.env.BASE_URL;

// Helper function to inject tracking into all <a> tags in the email body
const injectTrackingIntoLinks = (htmlContent, campaignId, contactId) => {
  const trackingBaseUrl = `${BASE_URL}/track/click/${campaignId}/${contactId}`;

  // Use regex to find and replace <a href="..."> links
  return htmlContent.replace(/<a\s+href="([^"]+)"/g, (match, url) => {
    const encodedUrl = encodeURIComponent(url); // Encode the original URL
    return `<a href="${trackingBaseUrl}?redirect=${encodedUrl}"`;
  });
};

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    await logEvent({
      action: 'create_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { name: campaign.name, subject: campaign.subject },
      organization: req.user.organization
    });
    res.status(201).json({ campaignId: campaign._id });
  } catch (error) {
    res.status(400).json({ error: 'Error creating campaign: ' + error.message });
  }
};

// Update campaign with selected template
exports.updateTemplate = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { templateId, subject, body, trackingEnabled } = req.body;

    console.log(req.body);

    // Step 1: Create a new template
    const newTemplate = new EmailTemplate({  // Fixed typo
      template: templateId,
      subject,
      body,
      trackingEnabled: trackingEnabled || false,
    });

    const savedTemplate = await newTemplate.save();

    // Step 2: Update the campaign with the newly created template
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { emailTemplate: savedTemplate._id }, // Link the new template to the campaign
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json({ campaign, template: savedTemplate });
  } catch (error) {
    console.error('Error creating template or updating campaign:', error);
    res.status(500).json({ error: 'Error creating template or updating campaign' });
  }
};

// Update campaign with selected contacts
exports.updateContacts = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { contactIds } = req.body;

    console.log(req.body);

    // Update the campaign with new contact IDs
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { targetContacts: contactIds },  // Update contacts in the targetContacts array
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating campaign contacts:", error);
    res.status(500).json({ error: "Error updating campaign contacts" });
  }
};

// Update campaign with selected sender emails
exports.updateSenderEmails = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { senderEmailIds } = req.body;

    console.log(req.body, req.params);

    // Update the campaign with the new sender emails
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { senderEmails: senderEmailIds },  // Set the sender emails field
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating sender emails:", error);
    res.status(500).json({ error: "Error updating sender emails" });
  }
};

// Update campaign with selected target categories
exports.updateTargetCategories = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { targetCategories } = req.body;

    // Update the campaign with the target categories
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { targetCategories },  // Set the target categories
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating target categories:", error);
    res.status(500).json({ error: "Error updating target categories" });
  }
};

// Get a campaign by ID
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('emailTemplate')
      .populate('senderEmails')
      .populate('targetContacts');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const targetContactsCount = campaign.targetContacts.length;

    res.status(200).json({
      campaign,
      targetContactsCount,
    });
  } catch (error) {
    res.status(400).json({ error: 'Error fetching campaign: ' + error.message });
  }
};

// Get all campaigns with optional filters
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('emailTemplate')
      .populate('senderEmails')
      .populate('targetContacts');

    console.log(campaigns);
    
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching campaigns: ' + error.message });
  }
};

// Update a campaign by ID
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.campaignId, req.body, { new: true });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });
    res.status(200).json(campaign);
  } catch (error) {
    res.status(400).json({ error: 'Error updating campaign: ' + error.message });
  }
};

// Delete a campaign by ID
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    await logEvent({
      action: 'delete_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { name: campaign.name },
      organization: req.user.organization
    });
    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting campaign: ' + error.message });
  }
};

// Start a campaign
exports.startCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('senderEmails') 
      .populate('targetContacts') 
      .populate('emailTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = 'running';
    await campaign.save();

    console.log('All sender emails:', campaign.senderEmails);

    let activeSenderIndex = 0;

    for (const contact of campaign.targetContacts) {
      try {
        let activeSender = campaign.senderEmails[activeSenderIndex];

        while (activeSender && activeSender.emailsSentToday >= activeSender.maxDailyLimit) {
          activeSenderIndex++;
          activeSender = campaign.senderEmails[activeSenderIndex];
        }

        if (!activeSender) {
          console.log('No active sender available. Pausing the campaign...');
          campaign.status = 'paused';
          await campaign.save();
          return res.status(200).json({
            message: 'Campaign paused as all sender emails have reached their limits.',
            campaign,
          });
        }

        const personalizedSubject = replacePlaceholders(campaign.emailTemplate.subject, contact);
        let personalizedBody = replacePlaceholders(campaign.emailTemplate.body, contact);

        if (campaign.emailTemplate.trackingEnabled) {
          personalizedBody = injectTrackingIntoLinks(personalizedBody, campaign._id, contact._id);
        }

        const emailSent = await sendEmail({
            senderId: activeSender._id,
            campaign: campaign._id,
            createdBy: campaign.createdBy,
            organization: campaign.organization,
            emailTemplate: campaign.emailTemplate,
            to: contact.email,
            subject: personalizedSubject,
            html: personalizedBody,
          });
        
        campaign.sentCount += 1;

        if (emailSent) {
            
            campaign.deliveredCount += 1; // Assuming email is delivered successfully
          } else {
            campaign.bouncedCount += 1; // Increment bounced count if sending fails
          }

        activeSender.emailsSentToday++;

        await activeSender.save();
      } catch (error) {
        console.error('Error sending email to contact:', contact.email, error);
      }
    }

    await logEvent({
      action: 'send_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { recipients: campaign.targetContacts.map(c => c.email) },
      organization: req.user.organization
    });

    res.status(200).json({ message: 'Campaign started successfully', campaign });
  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(400).json({ error: 'Error starting campaign' });
  }
};

// Update the status of the campaign (pause, running, etc.)
exports.updateStatus = async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      campaign.status = req.body.status;
      await campaign.save();
      await logEvent({
        action: 'update_campaign',
        user: req.user._id,
        resource: 'Campaign',
        resourceId: campaign._id,
        details: { before: oldCampaign, after: campaign },
        organization: req.user.organization
      });
      res.status(200).json(campaign);
    } catch (error) {
      res.status(400).json({ error: 'Error updating campaign status: ' + error.message });
    }
  };
  
  
  
  // Route to track email opens
  exports.trackOpen = async (req, res) => {
    const { campaignId, customerId } = req.params;
  
    console.log(req.params);
  
    try {
      // Find the campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      // Find the contact by contactId in the Contact model
      const contact = await Customer.findById(customerId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
  
      // Add the contact's ID to the campaign's contactsOpened array
      if (!campaign.contactsOpened.includes(contact._id)) {
        campaign.contactsOpened.push(contact._id);
      }
  
      // Optionally update the campaign's open count
      campaign.openCount = (campaign.openCount || 0) + 1;
  
      // Save the updated campaign
      await campaign.save();
  
      // --- NEW: Extract analytics info ---
      // Get IP address (handle proxies)
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
      const geo = geoip.lookup(ip) || {};
      const country = geo.country || 'Unknown';
  
      // Parse user agent
      const ua = req.headers['user-agent'] || '';
      const parser = new UAParser(ua);
      const deviceType = parser.getDevice().type || 'desktop';
      const client = parser.getBrowser().name || 'Unknown';
  
      // Log to EmailLogs (or CampaignLogs if you prefer)
      await EmailLogs.create({
        emailId: null, // If you have the emailId, set it here
        status: 'opened',
        deviceType,
        client,
        country,
        // Optionally add campaignId, customerId, timestamp, etc.
      });
  
      // Send the 1x1 pixel image (transparent GIF) for open tracking
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP8A//8AAAAAAwAAACwAAAAAAQABAAEAAAIBAAEAAQAAAOwAAAAAIAEAAQABAAAABwEAAQAAIAEAAEAAAwAAAAAAQABAAEAAAAABwAAA==', 'base64'));
    } catch (error) {
      console.error('Error tracking open event:', error);
      res.status(500).json({ error: 'Error tracking open event' });
    }
  };
  
  
