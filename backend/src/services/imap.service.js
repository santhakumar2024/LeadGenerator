"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initImapListener = void 0;
const node_imap_1 = __importDefault(require("node-imap"));
const mailparser_1 = require("mailparser");
const prisma_1 = require("../prisma");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const imapConfig = {
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    host: process.env.IMAP_HOST || '',
    port: Number(process.env.IMAP_PORT) || 993,
    tls: process.env.IMAP_TLS === 'true',
    tlsOptions: { rejectUnauthorized: false }
};
const initImapListener = () => {
    const imap = new node_imap_1.default(imapConfig);
    imap.once('ready', () => {
        console.log('IMAP connected. Listening for new leads...');
        imap.openBox('INBOX', false, (err, box) => {
            if (err)
                throw err;
            imap.on('mail', (numNewMsgs) => {
                console.log(`New mail received: ${numNewMsgs}`);
                processUnseenEmails(imap);
            });
            // Initial process on startup
            processUnseenEmails(imap);
        });
    });
    imap.once('error', (err) => {
        console.error('IMAP error:', err);
    });
    imap.once('end', () => {
        console.log('IMAP connection ended');
    });
    imap.connect();
};
exports.initImapListener = initImapListener;
const processUnseenEmails = (imap) => {
    imap.search(['UNSEEN'], (err, results) => {
        if (err || !results || results.length === 0)
            return;
        const f = imap.fetch(results, { bodies: '' });
        f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
                (0, mailparser_1.simpleParser)(stream, (err, parsed) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    if (err)
                        return;
                    const email = (_b = (_a = parsed.from) === null || _a === void 0 ? void 0 : _a.value[0]) === null || _b === void 0 ? void 0 : _b.address;
                    const name = (_d = (_c = parsed.from) === null || _c === void 0 ? void 0 : _c.value[0]) === null || _d === void 0 ? void 0 : _d.name;
                    const text = parsed.text || '';
                    if (!email)
                        return;
                    // Filter for "Lead" as per requirements
                    if (text.toLowerCase().includes('lead')) {
                        try {
                            const existingLead = yield prisma_1.prisma.lead.findUnique({ where: { email } });
                            if (!existingLead) {
                                yield prisma_1.prisma.lead.create({
                                    data: {
                                        email,
                                        name,
                                        status: 'NEW',
                                        initial_message_id: parsed.messageId
                                    }
                                });
                                console.log(`Saved new lead: ${email}`);
                            }
                        }
                        catch (error) {
                            console.error('Failed to save lead:', error);
                        }
                    }
                }));
            });
            msg.once('attributes', (attrs) => {
                imap.addFlags(attrs.uid, ['\\Seen'], (err) => {
                    if (err)
                        console.error('Error marking as seen:', err);
                });
            });
        });
        f.once('error', (err) => {
            console.error('Fetch error:', err);
        });
    });
};
