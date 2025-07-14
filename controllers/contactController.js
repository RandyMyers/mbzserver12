const nodemailer = require('nodemailer');

// POST /api/contact
exports.sendContactEmail = async (req, res) => {
  const { name, email, phone, subject, otherSubject, message } = req.body;

  console.log('[Contact] Incoming request:', { name, email, phone, subject, otherSubject, message });

  if (!name || !email || !subject || !message) {
    console.log('[Contact] Missing required fields.');
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  const finalSubject = subject === 'Other' && otherSubject ? otherSubject : subject;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mbztechnology.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `Contact Form <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER || 'hello@mbztechnology.com',
      subject: `[Contact Form] ${finalSubject}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${finalSubject}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
             <p><strong>Subject:</strong> ${finalSubject}</p>
             <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };

    console.log('[Contact] Sending email with options:', mailOptions);
    await transporter.sendMail(mailOptions);
    console.log('[Contact] Email sent successfully.');
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('[Contact] Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again later.' });
  }
}; 