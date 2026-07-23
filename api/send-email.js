const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Simple internal auth
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.STRIPE_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, subject, text, html } = req.body;
  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing to or subject' });
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    console.error('No GMAIL_APP_PASSWORD configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'rafael@serendipitytravelexperiences.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: 'Serendipity Travel Ibiza <rafael@serendipitytravelexperiences.com>',
      to,
      subject,
      text: text || subject,
      html: html || '<p>' + (text || subject) + '</p>',
    });

    return res.status(200).json({ sent: true, id: info.messageId });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
