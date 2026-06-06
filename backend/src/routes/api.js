"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leads_controller_1 = require("../controllers/leads.controller");
const campaigns_controller_1 = require("../controllers/campaigns.controller");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// Dashboard
router.get('/dashboard/stats', dashboard_controller_1.getDashboardStats);
// Leads
router.get('/leads', leads_controller_1.getLeads);
router.patch('/leads/:id/status', leads_controller_1.updateLeadStatus);
// Campaigns
router.get('/campaigns', campaigns_controller_1.getCampaigns);
router.post('/campaigns', campaigns_controller_1.createCampaign);
router.put('/campaigns/:id', campaigns_controller_1.updateCampaign);
router.delete('/campaigns/:id', campaigns_controller_1.deleteCampaign);
exports.default = router;
