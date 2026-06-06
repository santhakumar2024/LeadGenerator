/*
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, 
    auth: {
        user: "admin@quentronova.com",
        pass: "SruthiSantha0401@",
    },
});

async function runDrip() {
    // 1. Find the first 'NEW' lead in the DB
    const lead = await prisma.lead.findFirst({
        where: { status: 'NEW' } // Mapped to uppercase to match schema
    });

    if (!lead) {
        console.log("No new leads in the database to email.");
        return;
    }

    // 2. Draft the personalized email
    const mailOptions = {
        from: '"QuentroNova Admin" <admin@quentronova.com>',
        to: lead.email,
        subject: `Quick question for you, ${lead.first_name || 'there'}`, // Mapped to 'first_name' to match schema
        text: `Hi ${lead.first_name || 'there'},\n\nI saw your inquiry. As a software consulting firm, QuentroNova would love to help. Are you free for a 5-minute chat?\n\nBest,\nAdmin @ QuentroNova`,
    };

    try {
        // 3. Send the email
        await transporter.sendMail(mailOptions);
        
        // 4. Update the lead status so we don't email them again immediately
        await prisma.lead.update({
            where: { id: lead.id },
            data: { 
                status: 'CONTACTED', // Mapped to uppercase
                last_contacted_at: new Date()
            }
        });

        console.log(`🚀 Automated email sent to: ${lead.email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

runDrip();
*/
