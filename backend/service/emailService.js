const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends a builder approval email.
 * @param {string} toEmail - The builder's email address.
 * @param {string} builderName - The builder's first name.
 * @param {string} companyName - The builder's company name.
 */
async function sendBuilderApprovalEmail(toEmail, builderName, companyName) {
  const mailOptions = {
    from: `"OWNLY Platform" <${process.env.SENDER_EMAIL}>`,
    to: toEmail,
    subject: "🎉 Your Builder License Has Been Approved — OWNLY",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Builder Approved</title>
        <style>
          body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #111111; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #111111 100%); padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #2a2a2a; }
          .logo { font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #C9A96E; }
          .badge { display: inline-block; margin-top: 12px; padding: 5px 14px; background: rgba(201,169,110,0.12); border: 1px solid rgba(201,169,110,0.3); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #C9A96E; }
          .body { padding: 40px; }
          .icon { text-align: center; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 12px; text-align: center; }
          p { color: #888888; font-size: 14px; line-height: 1.8; margin: 0 0 16px; }
          .highlight { color: #C9A96E; font-weight: 600; }
          .info-box { background: #1a1a1a; border: 1px solid #2a2a2a; border-left: 3px solid #C9A96E; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
          .info-box p { margin: 0; color: #aaaaaa; font-size: 13px; }
          .cta-btn { display: block; width: fit-content; margin: 28px auto; padding: 14px 32px; background: #C9A96E; color: #000000; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-decoration: none; border-radius: 8px; text-transform: uppercase; }
          .steps { margin: 24px 0; }
          .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
          .step-num { flex-shrink: 0; width: 24px; height: 24px; background: rgba(201,169,110,0.15); border: 1px solid rgba(201,169,110,0.3); border-radius: 50%; color: #C9A96E; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
          .step-text { color: #888888; font-size: 13px; line-height: 1.6; }
          .footer { padding: 24px 40px; border-top: 1px solid #1e1e1e; text-align: center; }
          .footer p { color: #444444; font-size: 11px; margin: 0; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="logo">OWNLY</div>
            <div class="badge">✦ BUILDER VERIFIED</div>
          </div>
          <div class="body">
            <div class="icon">✅</div>
            <h1>Your License Has Been Approved!</h1>
            <p>Congratulations, <span class="highlight">${builderName}</span>! Your builder registration${companyName ? ` for <span class="highlight">${companyName}</span>` : ""} has been reviewed and <strong style="color:#C9A96E;">approved</strong> by the OWNLY admin team.</p>
            <p>You now have full access to the OWNLY builder portal where you can submit projects, manage milestones, and raise capital from real estate investors across India.</p>

            <div class="info-box">
              <p>🔐 Your account is now <strong style="color:#C9A96E;">VERIFIED</strong>. Sign in to your builder dashboard to get started.</p>
            </div>

            <div class="steps">
              <div class="step">
                <div class="step-num">1</div>
                <div class="step-text">Sign in at <span class="highlight">ownly.in/login</span> using your registered email and password.</div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div class="step-text">Go to your <strong style="color:#ccc;">Builder Dashboard</strong> and complete your company profile.</div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div class="step-text">Submit your first project for investor funding — include RERA ID, milestones, and documents.</div>
              </div>
            </div>

            <a href="http://localhost:3000/login" class="cta-btn">Sign In to Builder Portal →</a>

            <p style="font-size:12px; color:#555; text-align:center; margin-top:8px;">Need help? Reach us at <span class="highlight">support@ownly.in</span></p>
          </div>
          <div class="footer">
            <p>© 2025 OWNLY · Real Estate Tokenization Platform · India</p>
            <p style="margin-top:6px;">This email was sent to ${toEmail} because you registered as a builder on OWNLY.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Approval email sent to ${toEmail}`);
}

/**
 * Sends a builder rejection email with the admin's reason.
 * @param {string} toEmail - The builder's email address.
 * @param {string} builderName - The builder's first name.
 * @param {string} companyName - The builder's company name.
 * @param {string} reason - The rejection reason written by the admin.
 */
async function sendBuilderRejectionEmail(toEmail, builderName, companyName, reason) {
  const mailOptions = {
    from: `"OWNLY Platform" <${process.env.SENDER_EMAIL}>`,
    to: toEmail,
    subject: "Update on Your Builder Registration — OWNLY",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Builder Registration Update</title>
        <style>
          body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #111111; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #111111 100%); padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #2a2a2a; }
          .logo { font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #C9A96E; }
          .badge { display: inline-block; margin-top: 12px; padding: 5px 14px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #ef4444; }
          .body { padding: 40px; }
          .icon { text-align: center; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 12px; text-align: center; }
          p { color: #888888; font-size: 14px; line-height: 1.8; margin: 0 0 16px; }
          .highlight { color: #C9A96E; font-weight: 600; }
          .reason-box { background: #1a1a1a; border: 1px solid #2a2a2a; border-left: 3px solid #ef4444; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
          .reason-box .label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #ef4444; margin: 0 0 8px; text-transform: uppercase; }
          .reason-box .reason-text { color: #cccccc; font-size: 14px; line-height: 1.7; margin: 0; }
          .next-steps-box { background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15); border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
          .next-steps-box p { margin: 0; color: #999; font-size: 13px; }
          .cta-btn { display: block; width: fit-content; margin: 28px auto; padding: 14px 32px; background: #1e1e1e; color: #C9A96E; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-decoration: none; border-radius: 8px; border: 1px solid rgba(201,169,110,0.3); text-transform: uppercase; }
          .footer { padding: 24px 40px; border-top: 1px solid #1e1e1e; text-align: center; }
          .footer p { color: #444444; font-size: 11px; margin: 0; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="logo">OWNLY</div>
            <div class="badge">⚠ REGISTRATION UPDATE</div>
          </div>
          <div class="body">
            <div class="icon">📋</div>
            <h1>Registration Not Approved</h1>
            <p>Hi <span class="highlight">${builderName}</span>, thank you for your interest in joining OWNLY as a builder${companyName ? ` with <span class="highlight">${companyName}</span>` : ""}.</p>
            <p>After reviewing your submission, our admin team was unable to approve your registration at this time. Please see the reason below:</p>

            <div class="reason-box">
              <p class="label">Admin's Note</p>
              <p class="reason-text">${reason || "Your submitted documents or information did not meet our current verification requirements."}</p>
            </div>

            <div class="next-steps-box">
              <p>💡 <strong style="color:#C9A96E;">What you can do next:</strong> Address the points mentioned above and re-register with the correct information and documents. Our team reviews every submission carefully.</p>
            </div>

            <p>If you believe this is a mistake or have questions, please reach out to our support team — we're happy to help clarify the requirements.</p>

            <a href="mailto:support@ownly.in" class="cta-btn">Contact Support →</a>

            <p style="font-size:12px; color:#555; text-align:center; margin-top:8px;">Or email us at <span class="highlight">support@ownly.in</span></p>
          </div>
          <div class="footer">
            <p>© 2025 OWNLY · Real Estate Tokenization Platform · India</p>
            <p style="margin-top:6px;">This email was sent to ${toEmail} because you registered as a builder on OWNLY.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Rejection email sent to ${toEmail}`);
}

module.exports = { sendBuilderApprovalEmail, sendBuilderRejectionEmail };
