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
exports.updateLeadStatus = exports.getLeads = void 0;
const prisma_1 = require("../prisma");
const getLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leads = yield prisma_1.prisma.lead.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
exports.getLeads = getLeads;
const updateLeadStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const lead = yield prisma_1.prisma.lead.update({
            where: { id },
            data: { status }
        });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});
exports.updateLeadStatus = updateLeadStatus;
