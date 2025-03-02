const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailTemplates = {
    shelterRegistration: (shelter) => ({
        subject: 'New Shelter Registration - DazeeChain',
        text: `
A new shelter has registered on DazeeChain:

Shelter Name: ${shelter.shelterName}
Location: ${shelter.city}, ${shelter.state}
Contact: ${shelter.email}

Please review their registration in the admin dashboard.
        `,
        html: `
            <h2>New Shelter Registration</h2>
            <p>A new shelter has registered on DazeeChain:</p>
            <table>
                <tr>
                    <td><strong>Shelter Name:</strong></td>
                    <td>${shelter.shelterName}</td>
                </tr>
                <tr>
                    <td><strong>Location:</strong></td>
                    <td>${shelter.city}, ${shelter.state}</td>
                </tr>
                <tr>
                    <td><strong>Contact:</strong></td>
                    <td>${shelter.email}</td>
                </tr>
            </table>
            <p>
                <a href="https://dazeechain.us/admin/dashboard.html">
                    Review their registration in the admin dashboard
                </a>
            </p>
        `
    }),

    registrationApproved: (shelter) => ({
        subject: 'Welcome to DazeeChain - Registration Approved!',
        text: `
Congratulations! Your shelter registration has been approved.

Shelter Name: ${shelter.shelterName}
Your Referral Code: ${shelter.referralCode}

You can now access the shelter portal and start using DazeeChain's features.

Next Steps:
1. Log in to your shelter portal
2. Complete your shelter profile
3. Start adding pets to the platform

Share your referral code with other shelters to earn rewards!
        `,
        html: `
            <h2>Welcome to DazeeChain!</h2>
            <p>Congratulations! Your shelter registration has been approved.</p>
            <table>
                <tr>
                    <td><strong>Shelter Name:</strong></td>
                    <td>${shelter.shelterName}</td>
                </tr>
                <tr>
                    <td><strong>Your Referral Code:</strong></td>
                    <td><strong>${shelter.referralCode}</strong></td>
                </tr>
            </table>
            <h3>Next Steps:</h3>
            <ol>
                <li>Log in to your shelter portal</li>
                <li>Complete your shelter profile</li>
                <li>Start adding pets to the platform</li>
            </ol>
            <p>Share your referral code with other shelters to earn rewards!</p>
            <p>
                <a href="https://dazeechain.us/shelter-portal.html">
                    Access Your Shelter Portal
                </a>
            </p>
        `
    })
};

async function sendEmail(to, template, data) {
    const { subject, text, html } = emailTemplates[template](data);
    
    const msg = {
        to,
        from: process.env.NOTIFICATION_EMAIL,
        subject,
        text,
        html
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = {
    sendEmail
};
