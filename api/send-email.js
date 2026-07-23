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

  const from = 'rafael@serendipitytravelexperiences.com';

  // Build RFC 2822 email
  const boundary = '----=_Part_' + Date.now();
  const emailLines = [
    'From: Serendipity Travel Ibiza <' + from + '>',
    'To: ' + to,
    'Subject: =?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(text || subject).toString('base64'),
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html || '<p>' + (text || subject) + '</p>').toString('base64'),
    '',
    '--' + boundary + '--',
  ];

  const rawEmail = Buffer.from(emailLines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Send via Gmail API
  const token = process.env.GOOGLE_WORKSPACE_CLI_TOKEN;
  if (!token) {
    console.error('No GOOGLE_WORKSPACE_CLI_TOKEN');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawEmail }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gmail API error:', response.status, err);
      return res.status(500).json({ error: 'Email send failed', detail: err });
    }

    const result = await response.json();
    return res.status(200).json({ sent: true, id: result.id });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
