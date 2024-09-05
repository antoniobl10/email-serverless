const nodemailer = require('nodemailer');

const createTransporter = (service) => {
  if (service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail', // Configuración para Gmail
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

module.exports = async (req, res) => {
  const allowedOrigins = ['http://localhost:4321', 'https://www.asaplegal.com'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin); // Allow only the specified origins
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { service, to, subject, body } = req.body;

  if (!service || !to || !subject || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = createTransporter(service);

    await transporter.sendMail({
      from: service === 'gmail' ? process.env.GMAIL_USER : process.env.OUTLOOK_USER,
      to,
      subject,
      text: body
    });

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: error });
  }
};
