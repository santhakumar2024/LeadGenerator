/*
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const imapConfig = {
  user: 'admin@quentronova.com',
  password: 'SruthiSantha0401@',
  host: 'imap.hostinger.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const imap = new Imap(imapConfig);

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', () => {
  openInbox((err, box) => {
    if (err) throw err;
    
    // Search for ALL emails
    imap.search(['ALL'], (err, results) => {
      if (err || !results.length) {
        console.log("No new leads found in inbox.");
        imap.end();
        return;
      }

      const f = imap.fetch(results, { bodies: '' });
      f.on('message', (msg) => {
        msg.on('body', async (stream) => {
          const parsed = await simpleParser(stream);
          
          console.log(`Processing email from: ${parsed.from.text}`);

          // Logic: If email subject contains "Lead", save to DB
          if (parsed.subject && parsed.subject.toLowerCase().includes('lead')) {
            try {
              const newLead = await prisma.lead.create({
                data: {
                  email: parsed.from.value[0].address,
                  first_name: parsed.from.value[0].name || 'New Lead', // Mapped to 'first_name' to match schema
                  status: 'NEW' // Mapped to uppercase to match schema default
                }
              });
              console.log(`✅ Success! Lead saved to DB: ${newLead.email}`);
            } catch (error) {
              console.error(`Failed to save lead (might already exist): ${parsed.from.value[0].address}`);
            }
          }
        });
      });

      f.once('end', () => {
        console.log('Done fetching all messages!');
        setTimeout(() => imap.end(), 2000); // Small delay to let async Prisma finish
      });
    });
  });
});

imap.once('error', (err) => console.error("IMAP Error:", err));
imap.connect();
*/
