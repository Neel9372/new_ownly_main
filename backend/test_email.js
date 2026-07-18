require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendTest() {
  console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
  console.log('SMTP_APP_PASSWORD set:', !!process.env.SMTP_APP_PASSWORD);

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Connection OK');

    // Send test email to the sender (self-test)
    const info = await transporter.sendMail({
      from: `"OWNLY Test" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL,  // send to self to verify
      subject: '🧪 OWNLY SMTP Test — Email Working',
      html: `<h2 style="color:#C9A96E;">SMTP Test Passed!</h2><p>This is a test email from the OWNLY backend. If you see this, email sending is working correctly.</p><p>Time: ${new Date().toISOString()}</p>`,
    });

    console.log('✅ Test email sent!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    console.error('Full error:', err);
  } finally {
    process.exit(0);
  }
}

sendTest();
