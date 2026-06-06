"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const imap_service_1 = require("./services/imap.service");
const drip_service_1 = require("./services/drip.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', api_1.default);
app.use('/api', leadRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Initialize background services
    (0, imap_service_1.initImapListener)();
    (0, drip_service_1.initDripCampaignCron)();
});
