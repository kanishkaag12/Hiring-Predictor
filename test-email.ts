// Quick test script to debug email configuration
import 'dotenv/config';
import nodemailer from 'nodemailer';

const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM;

console.log('=== Email Configuration Debug ===');
console.log('EMAIL_HOST:', emailHost || '(not set)');
console.log('EMAIL_PORT:', emailPort || '(not set)');
console.log('EMAIL_USER:', emailUser || '(not set)');
console.log('EMAIL_PASS:', emailPass ? `${emailPass.substring(0, 10)}...` : '(not set)');
console.log('EMAIL_FROM:', emailFrom || '(not set)');
console.log('================================\n');

if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
    console.log('❌ Email configuration incomplete');
    process.exit(1);
}

async function testEmail() {
    try {
        const transporter = nodemailer.createTransport({
            host: emailHost,
            port: parseInt(emailPort!),
            secure: emailPort === '465',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');

        // Send a test email
        console.log('Sending test email to:', emailFrom);
        const info = await transporter.sendMail({
            from: `"Test" <${emailFrom}>`,
            to: emailFrom, // Send to self for testing
            subject: 'Test Email from Hiring Predictor',
            text: 'If you receive this, your email configuration is working!',
            html: '<p>If you receive this, your email configuration is <strong>working</strong>!</p>',
        });

        console.log('✅ Test email sent!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testEmail();
