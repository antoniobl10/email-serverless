const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

// Middleware
const allowedOrigins = [
  'https://nationwidelegal.com',
  'https://asaplegal.com',
  'https://processserver.com',
  'https://admin.processserver.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow requests from allowed origins
    } else {
      callback(new Error('Not allowed by CORS')); // Block other origins
    }
  }
}));

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

//app.get("/", (req, res) => {return res.json({ test: process.env.OUTLOOK_PASS })})

app.post('/api/sendEmail', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { service, subject, body, isOrder, formData, formType, isTesting } = req.body;

  if (!service || !subject || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }



  let finalSubject = 'Contact form - ' + subject;
  letcc_recipients = [];
  let recipients = [];

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
        'Sales@nationwidelegal.com'
      ]
    } else if (formType === 'Investigations') {
      recipients = [
        'investigations@nationwidelegal.com',
      ];
    } else if (formType === 'Court Reporting') {
      recipients = [
        'emann@nationwidelegal.com'
      ];
    }

  } else if (isTesting) {
    finalSubject = '[TEST] ' + finalSubject;
    recipients = [
      'developers@nationwidelegal.com',
      'mfernandez@nationwidelegal.com'
    ];
    cc_recipients = ['david.tarianet@gmail.com'];
  } else { // ASAP Legal
    finalSubject = 'ASAP Legal - ' + subject;
    recipients = [
      'Julien@asaplegal.com',
    ];
    cc_recipients = [
      'Sales@nationwidelegal.com',
      'anikola@nationwidelegal.com'
    ]
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

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending email. Please email us ASAP to web@nationwidelegal.com', error: error.message });
  }
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});