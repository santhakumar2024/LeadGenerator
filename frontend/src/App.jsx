import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardOverview from './pages/DashboardOverview';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/LeadList';
import WebScraping from './pages/WebScraping';
import TemplateEditor from './pages/TemplateEditor';
import ColdCallQueue from './pages/ColdCallQueue';
import ScheduleMeeting from './pages/ScheduleMeeting';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<LeadList />} />
          <Route path="templates" element={<TemplateEditor />} />
          <Route path="calls" element={<ColdCallQueue />} />
          <Route path="scraping" element={<WebScraping />} />
        </Route>
        {/* Public Booking Route */}
        <Route path="/schedule/:leadId" element={<ScheduleMeeting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
