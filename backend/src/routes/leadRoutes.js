"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leadController_1 = require("../controllers/leadController");
const router = (0, express_1.Router)();
router.post('/leads/inbound', leadController_1.inboundForm);
router.post('/webhooks/social', leadController_1.socialWebhook);
router.post('/leads/scrape', leadController_1.triggerScraper);
exports.default = router;
