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
exports.initDripCampaignCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../prisma");
const smtp_service_1 = require("./smtp.service");
const parseTemplate = (template, lead) => {
    const placeholders = {
        first_name: lead.first_name || 'there',
        last_name: lead.last_name || '',
        company_name: lead.company_name || 'your company',
        job_title: lead.job_title || 'professional',
        company_type: lead.company_type || 'industry'
    };
    return template.replace(/{{(\w+)}}/g, (match, key) => {
        return placeholders[key] !== undefined ? placeholders[key] : match;
    });
};
const initDripCampaignCron = () => {
    // Run every 24 hours at 9:00 AM (server time)
    node_cron_1.default.schedule('0 9 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running drip campaign job...');
        try {
            // Find leads that are CONTACTED
            const activeLeads = yield prisma_1.prisma.lead.findMany({
                where: {
                    status: 'CONTACTED',
                    last_contacted_at: {
                        // Find leads contacted more than 3 days ago
                        lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            console.log(`Found ${activeLeads.length} leads due for follow-up.`);
            const campaigns = yield prisma_1.prisma.campaign.findMany({
                orderBy: { step_number: 'asc' }
            });
            if (campaigns.length === 0) {
                console.log('No campaigns configured.');
                return;
            }
            for (const lead of activeLeads) {
                const nextStep = lead.step_count + 1;
                const template = campaigns.find((c) => c.step_number === nextStep);
                if (template) {
                    const personalizedSubject = parseTemplate(template.subject, lead);
                    const personalizedBody = parseTemplate(template.body, lead);
                    // Send next email with threading logic
                    yield (0, smtp_service_1.sendEmail)(lead.email, personalizedSubject, personalizedBody, lead.initial_message_id || undefined, lead.initial_message_id || undefined // Simple reference to initial email
                    );
                    // Update lead status
                    yield prisma_1.prisma.lead.update({
                        where: { id: lead.id },
                        data: {
                            step_count: nextStep,
                            last_contacted_at: new Date()
                        }
                    });
                    console.log(`Sent step ${nextStep} to ${lead.email}`);
                }
                else {
                    // No more templates, mark as COMPLETED
                    yield prisma_1.prisma.lead.update({
                        where: { id: lead.id },
                        data: { status: 'COMPLETED' }
                    });
                    console.log(`Completed sequence for ${lead.email}`);
                }
            }
        }
        catch (error) {
            console.error('Error in drip campaign cron:', error);
        }
    }));
    console.log('Drip campaign cron initialized.');
};
exports.initDripCampaignCron = initDripCampaignCron;
