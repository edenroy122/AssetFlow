const nodemailer = require('nodemailer');

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return entities[character];
});

const sendWelcomeEmail = async ({ firstName, lastName, email, password, role }) => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail email settings are missing. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  const name = `${firstName} ${lastName}`.trim();
  const loginUrl = `${(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')}/login`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const safeRole = escapeHtml(role);
  const safeLoginUrl = escapeHtml(loginUrl);

  await transporter.sendMail({
    from: `AssetFlow AMS <${gmailUser}>`,
    to: email,
    subject: 'Your AssetFlow AMS account is ready',
    text: [
      `Hello ${name},`,
      '',
      'Your AssetFlow AMS account has been created.',
      `Role: ${role}`,
      `Login email: ${email}`,
      `Password: ${password}`,
      `Sign in: ${loginUrl}`,
      '',
      'Please sign in and change your password after your first login.'
    ].join('\n'),
    html: `
      <div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px">
          <h1 style="margin:0 0 8px;font-size:22px">Your account is ready</h1>
          <p style="margin:0 0 24px;color:#475569">Hello ${safeName}, your AssetFlow AMS account has been created.</p>
          <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
            <p style="margin:0 0 12px"><strong>Role:</strong> ${safeRole}</p>
            <p style="margin:0 0 12px"><strong>Login email:</strong> ${safeEmail}</p>
            <p style="margin:0"><strong>Password:</strong> ${safePassword}</p>
          </div>
          <p style="margin:24px 0">
            <a href="${safeLoginUrl}" style="display:inline-block;padding:12px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Sign in to AssetFlow</a>
          </p>
          <p style="margin:0;color:#64748b;font-size:13px">Please sign in and change your password after your first login.</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendWelcomeEmail };
