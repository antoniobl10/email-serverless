const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const createTransporter = (service) => {
  if (service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  } else if (service === 'office365') {
    return nodemailer.createTransport({
      host: 'smtp.office365.com',
      secure: false,
      port: '587',
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASS
      },
      debug: true,
      logger: true,
    });
  } else {
    throw new Error('Unsupported service');
  }
};

app.post('/api/sendEmail', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { service, subject, body, isOrder, formData, formType } = req.body;
  let finalSubject = 'ASAP Legal - ' + subject;

  if (!service || !subject || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (isOrder) {
    finalSubject = 'New Order - ' + subject;

    recipients = [
      'jcaamal@nationwidelegal.com',
      'ksweet@nationwidelegal.com',
      'developers@nationwidelegal.com'
    ];
    if (formType === 'Service of Process' || formType === 'E-Filing'
      || formType === 'Court Services' || formType === 'Subpoena Services') {
      recipients = [
        'ANikola@nationwidelegal.com',
      ];
      cc_recipients = [
      'Sales@nationwidelegal.com'];
    } else if (formType === 'Investigations') {
      recipients = [
        'investigations@nationwidelegal.com',
      ];
    } else if (formType === 'Court Reporting') {
      recipients = [
        'emann@nationwidelegal.com'
      ];
    }

    // recipients = [
    //   'jcaamal@nationwidelegal.com',
    //   'ksweet@nationwidelegal.com',
    //   'developers@nationwidelegal.com'
    // ];

    // recipients = [
    //   'david.tarianet@gmail.com'
    // ];
  }

  try {
    const transporter = createTransporter(service);
  
    const mailOptions = {
      from: service === 'gmail' ? process.env.GMAIL_USER : process.env.OUTLOOK_USER,
      to: recipients.join(', '),
      subject: finalSubject,
      html: body // Use HTML as the email body
    };
  
    // Add cc only if cc_recipients is present and not empty
    if (cc_recipients && cc_recipients.length > 0) {
      mailOptions.cc = cc_recipients.join(', ');
    }
  
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});