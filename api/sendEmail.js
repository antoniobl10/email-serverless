const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

// Middleware
const allowedOrigins = [
  'https://admin.processserver.com',
  'https://nationwidelegal.com',
  'https://processserver.com'
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
      'Sales@nationwidelegal.com']
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

    await transporter.sendMail({
      from: service === 'gmail' ? process.env.GMAIL_USER : process.env.OUTLOOK_USER,
      to: recipients.join(', '),
      subject: finalSubject,
      // text: body, // Usar el texto como cuerpo del email
      html: body
    });

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});