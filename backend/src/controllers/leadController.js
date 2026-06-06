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
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerScraper = exports.socialWebhook = exports.inboundForm = void 0;
const prisma_1 = require("../prisma");
const scraper_service_1 = require("../services/scraper.service");
const inboundForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, first_name, job_title, company_name } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const lead = yield prisma_1.prisma.lead.upsert({
            where: { email },
            update: { status: 'NEW', first_name, job_title, company_name },
            create: { email, first_name, job_title, company_name, source: 'email_inbound', status: 'NEW' }
        });
        res.json({ success: true, lead });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.inboundForm = inboundForm;
const socialWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        if (req.query['hub.verify_token']) {
            if (req.query['hub.verify_token'] === process.env.WEBHOOK_TOKEN) {
                return res.send(req.query['hub.challenge']);
            }
            return res.status(403).json({ error: 'Invalid verify token' });
        }
        const payload = req.body;
        const leadEmail = ((_e = (_d = (_c = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.entry) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.changes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.email) || payload.email;
        const leadName = ((_k = (_j = (_h = (_g = (_f = payload === null || payload === void 0 ? void 0 : payload.entry) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.changes) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.value) === null || _k === void 0 ? void 0 : _k.full_name) || payload.name;
        if (!leadEmail) {
            return res.status(400).json({ error: 'No email found in webhook payload' });
        }
        // Upsert since social leads might click again
        const lead = yield prisma_1.prisma.lead.upsert({
            where: { email: leadEmail },
            update: { status: 'NEW' },
            create: {
                email: leadEmail,
                first_name: leadName || 'Social Lead',
                source: 'social_ads',
                status: 'NEW'
            }
        });
        res.json({ success: true, lead });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.socialWebhook = socialWebhook;
const triggerScraper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const result = yield (0, scraper_service_1.scrapeWebsite)(url);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.triggerScraper = triggerScraper;
