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

const fieldMapping = {
  "Contact Information": {
    "Contact Name": ["name1", "name2", "name3", "name4", "name5", "name6"],
    "Email": ["email1", "email2", "email3", "email4", "email5", "email6"],
    "Phone Number": ["phonenumber1", "phonenumber2", "phonenumber3", "phonenumber4", "phonenumber5", "phonenumber6"],
    "Company (Optional)": ["company1", "company2", "company3", "company4", "company5", "company6"],
    "Address Line 1": ["address1", "address2", "address3", "address4", "address5", "address6"],
    "City": ["city1", "city2", "city3", "city4", "city5", "city6"],
    "State": ["state1", "state2", "state3", "state4", "state5", "state6"],
    "ZIP Code": ["zip1", "zip2", "zip3", "zip4", "zip5", "zip6"]
  },
  "Order Information": {
    "Party Being Served": ["party_served1", "party_served2", "party_served3", "party_served4", "party_served5", "party_served6"],
    "Alternate Address Line 1": ["address2_1", "address2_2", "address2_3", "address2_4", "address2_5", "address2_6"],
    "Alternate City": ["city2_1", "city2_2", "city2_3", "city2_4", "city2_5", "city2_6"],
    "Alternate State": ["state2_1", "state2_2", "state2_3", "state2_4", "state2_5", "state2_6"],
    "Alternate ZIP Code": ["zip2_1", "zip2_2", "zip2_3", "zip2_4", "zip2_5", "zip2_6"],
    "Additional Address Line 1": ["address3_1", "address3_2", "address3_3", "address3_4", "address3_5", "address3_6"],
    "Additional City": ["city3_1", "city3_2", "city3_3", "city3_4", "city3_5", "city3_6"],
    "Additional State": ["state3_1", "state3_2", "state3_3", "state3_4", "state3_5", "state3_6"],
    "Additional ZIP Code": ["zip3_1", "zip3_2", "zip3_3", "zip3_4", "zip3_5", "zip3_6"],
    "List of Documents": ["documents1", "documents2", "documents3", "documents4", "documents5", "documents6"],
    "Special Instructions": ["message1", "message2", "message3", "message4", "message5", "message6"]
  },
  "Deposition Officer": {
    "Are we acting as your Deposition Officer?": ["depositionOfficer1", "depositionOfficer2", "depositionOfficer3", "depositionOfficer4", "depositionOfficer5", "depositionOfficer6"]
  }
}

const generateEmailBody = (formData, fieldMapping) => {
  let htmlBody = "<h2>Order Details</h2><table border='1'><thead><tr><th>Description</th><th>Value</th></tr></thead><tbody>";
  Object.entries(fieldMapping).forEach(([section, fields]) => {
    htmlBody += `<tr><th colspan="2">${section}</th></tr>`;
    Object.entries(fields).forEach(([description, keys]) => {
      keys.forEach((key) => {
        if (formData[key]) {
          htmlBody += `<tr><td>${description}</td><td>${formData[key]}</td></tr>`;
        }
      });
    });
  });
  htmlBody += "</tbody></table>";
  return htmlBody;
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

  const htmlBody = `
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
            background-color: #f4f4f4;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>Form Details</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${formData.map(item => `
              <tr>
                <td>${item.key}</td>
                <td>${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p>${body}</p>
      </body>
    </html>
  `;

  try {
    const transporter = createTransporter(service);

    await transporter.sendMail({
      from: service === 'gmail' ? process.env.GMAIL_USER : process.env.OUTLOOK_USER,
      to: recipients.join(', '),
      subject: finalSubject,
      // text: body, // Usar el texto como cuerpo del email
      html: generateEmailBody(formData, fieldMapping)
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