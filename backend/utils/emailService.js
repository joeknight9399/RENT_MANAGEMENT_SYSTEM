const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const emailWrapper = (content) => `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 30px; text-align: center;">
                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; padding: 6px 12px; color: #ffffff; font-weight: 800; font-size: 18px; letter-spacing: 1px; margin-bottom: 8px;">
                    RF
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">RENTFLOW</h1>
            </div>
            <div style="padding: 40px 30px;">
                ${content}
            </div>
            <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                    This is an automated security message from RentFlow.
                </p>
            </div>
        </div>
    </div>
`;

exports.sendPendingApprovalEmail = async (userEmail, userName) => {
    try {
        const content = `
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hi ${userName},</h2>
            <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
                Thanks for creating an account with us! We've successfully received your details.
            </p>
        `;
        await transporter.sendMail({
            from: '"RentFlow Support" <no-reply@rentflow.com>',
            to: userEmail,
            subject: 'We received your RentFlow application! 👋',
            html: emailWrapper(content)
        });
    } catch (error) {
        console.error('[EMAIL_SERVICE_ERROR]:', error);
    }
};

exports.sendApprovalStatusEmail = async (userEmail, userName, status) => {
    try {
        const isApproved = status === 'Active';
        let content = '';

        if (isApproved) {
            content = `
                <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Welcome to RentFlow, ${userName}! 🎉</h2>
                <p style="font-size: 15px; color: #475569; margin-bottom: 28px;">
                    Good news! Your account is approved.
                </p>
                <div style="text-align: center;">
                    <a href="http://localhost:3000/login" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700;">Go to Login</a>
                </div>
            `;
        } else {
            content = `
                <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${userName},</h2>
                <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
                    Your account request was not approved at this time.
                </p>
            `;
        }

        await transporter.sendMail({
            from: '"RentFlow Support" <no-reply@rentflow.com>',
            to: userEmail,
            subject: isApproved ? 'Approved' : 'Update regarding your application',
            html: emailWrapper(content)
        });
        console.log(`[EMAIL_SERVICE]: Decision alert (${status}) sent to ${userEmail}`);
    } catch (error) {
        console.error('[EMAIL_SERVICE_ERROR]:', error);
    }
};

// CRITICAL: Exporting the functions so they can be imported elsewhere
module.exports = {
    sendPendingApprovalEmail: exports.sendPendingApprovalEmail,
    sendApprovalStatusEmail: exports.sendApprovalStatusEmail
};