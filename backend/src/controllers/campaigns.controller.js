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
exports.deleteCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaigns = void 0;
const prisma_1 = require("../prisma");
const getCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const campaigns = yield prisma_1.prisma.campaign.findMany({
            orderBy: { step_number: 'asc' }
        });
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});
exports.getCampaigns = getCampaigns;
const createCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { step_number, subject, body } = req.body;
        const campaign = yield prisma_1.prisma.campaign.create({
            data: { step_number, subject, body }
        });
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});
exports.createCampaign = createCampaign;
const updateCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { step_number, subject, body } = req.body;
        const campaign = yield prisma_1.prisma.campaign.update({
            where: { id },
            data: { step_number, subject, body }
        });
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});
exports.updateCampaign = updateCampaign;
const deleteCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield prisma_1.prisma.campaign.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});
exports.deleteCampaign = deleteCampaign;
