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

const baseFieldDescriptions = {
  form_type: "Form Type",
  name: "Contact Name",
  email: "Email",
  phonenumber: "Phone Number",
  company: "Company (Optional)",
  address: "Address Line 1",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  party_served: "Party Being Served",
  address2: "Alternate Address Line 1",
  city2: "Alternate City",
  state2: "Alternate State",
  zip2: "Alternate ZIP Code",
  address3: "Additional Address Line 1",
  city3: "Additional City",
  state3: "Additional State",
  zip3: "Additional ZIP Code",
  documents: "List of Documents",
  message: "Special Instructions",
  depositionOfficer: "Are we acting as your Deposition Officer?"
};

const generateFieldDescriptions = (serviceNumber) => {
  const fieldDescriptions = {};
  Object.keys(baseFieldDescriptions).forEach((key) => {
    fieldDescriptions[`${key}${serviceNumber}`] = `${baseFieldDescriptions[key]} (Service ${serviceNumber})`;
  });
  return fieldDescriptions;
};

const generateEmailBody = (formData) => {
  let htmlBody = `
    <html>
      <head>
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background-color: #f2f2f2;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>Order Details</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
  `;

  Object.entries(formData).forEach(([key, value]) => {
    const description = allFieldDescriptions[key] || key; // Usa descripción o clave si no está mapeada
    htmlBody += `
      <tr>
        <td>${description}</td>
        <td>${value || "N/A"}</td>
      </tr>
    `;
  });

  htmlBody += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  return htmlBody;
};

// Combinar descripciones de todos los servicios
const allFieldDescriptions = {};
for (let i = 1; i <= 6; i++) {
  Object.assign(allFieldDescriptions, generateFieldDescriptions(i));
}

app.post('/api/sendEmail', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { service, subject, body, isOrder, formData, formType } = req.body;
  let finalSubject = 'ASAP Legal - ' + subject;

  if (!service || !subject || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  let recipients = [
    'anikola@nationwidelegal.com',
    'jcaamal@nationwidelegal.com',
    'julien@asaplegal.com'
  ];
  if (isOrder) {
    finalSubject = 'New Order - ' + subject;

    recipients = [
      'jcaamal@nationwidelegal.com',
      'ksweet@nationwidelegal.com',
      'developers@nationwidelegal.com'
    ];
    if (formType === 'Service of Process') {
      recipients = [
        'jcaamal@nationwidelegal.com',
        'ksweet@nationwidelegal.com',
        'developers@nationwidelegal.com'
      ];
    } else if (formType === 'E-Filing') {
      recipients = [
        'jcaamal@nationwidelegal.com',
        'ksweet@nationwidelegal.com',
        'developers@nationwidelegal.com'
      ];
    } else if (formType === 'Court Services') {
      recipients = [
        'jcaamal@nationwidelegal.com',
        'ksweet@nationwidelegal.com',
        'developers@nationwidelegal.com'
      ];
    } else if (formType === 'Court Reporting') {
      recipients = [
        'jcaamal@nationwidelegal.com',
        'ksweet@nationwidelegal.com',
        'developers@nationwidelegal.com'
      ];
    }
  }
  
  try {
    const transporter = createTransporter(service);

    await transporter.sendMail({
      from: service === 'gmail' ? process.env.GMAIL_USER : process.env.OUTLOOK_USER,
      to: recipients.join(', '),
      subject: finalSubject,
      // text: body, // Usar el texto como cuerpo del email
      html: generateEmailBody(formData)
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