import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { prisma } from '../prisma';
import dotenv from 'dotenv';

dotenv.config();

const imapConfig = {
  user: process.env.IMAP_USER || '',
  password: process.env.IMAP_PASSWORD || '',
  host: process.env.IMAP_HOST || '',
  port: Number(process.env.IMAP_PORT) || 993,
  tls: process.env.IMAP_TLS === 'true',
  tlsOptions: { rejectUnauthorized: false }
};

export const initImapListener = () => {
  const imap = new Imap(imapConfig);

  imap.once('ready', () => {
    console.log('IMAP connected. Listening for new leads...');
    imap.openBox('INBOX', false, (err, box) => {
      if (err) throw err;

      imap.on('mail', (numNewMsgs) => {
        console.log(`New mail received: ${numNewMsgs}`);
        processUnseenEmails(imap);
      });
      
      // Initial process on startup
      processUnseenEmails(imap);
    });
  });

  imap.once('error', (err: any) => {
    console.error('IMAP error:', err);
  });

  imap.once('end', () => {
    console.log('IMAP connection ended');
  });

  imap.connect();
};

const processUnseenEmails = (imap: Imap) => {
  imap.search(['UNSEEN'], (err, results) => {
    if (err || !results || results.length === 0) return;

    const f = imap.fetch(results, { bodies: '' });

    f.on('message', (msg, seqno) => {
      msg.on('body', (stream, info) => {
        simpleParser(stream, async (err, parsed) => {
          if (err) return;

          const email = parsed.from?.value[0]?.address;
          const name = parsed.from?.value[0]?.name;
          const text = parsed.text || '';
          
          if (!email) return;

          // Filter for "Lead" as per requirements
          if (text.toLowerCase().includes('lead')) {
            try {
              const existingLead = await prisma.lead.findUnique({ where: { email } });
              
              if (!existingLead) {
                await prisma.lead.create({
                  data: {
                    email,
                    name,
                    status: 'NEW',
                    initial_message_id: parsed.messageId
                  }
                });
                console.log(`Saved new lead: ${email}`);
              }
            } catch (error) {
              console.error('Failed to save lead:', error);
            }
          }
        });
      });
      
      msg.once('attributes', (attrs) => {
        imap.addFlags(attrs.uid, ['\\Seen'], (err) => {
           if (err) console.error('Error marking as seen:', err);
        });
      });
    });

    f.once('error', (err) => {
      console.error('Fetch error:', err);
    });
  });
};
