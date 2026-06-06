import { Outlet, NavLink } from 'react-router-dom';
import sidebarStyles from '../Sidebar.module.css';
import mainStyles from '../MainContent.module.css';
import { LayoutDashboard, Users, Mail, PhoneCall, Target } from 'lucide-react';
import ExitIntentPopup from './ExitIntentPopup';

const Layout = () => {
  return (
    <div className="dashboard-container">
      <aside className={sidebarStyles.sidebar}>
        <div className={sidebarStyles.logo}>QuentroNova</div>
        <NavLink 
          to="/" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <LayoutDashboard size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Dashboard
        </NavLink>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <LayoutDashboard size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Admin Directory
        </NavLink>
        <NavLink 
          to="/leads" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Leads
        </NavLink>
        <NavLink 
          to="/templates" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <Mail size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Templates
        </NavLink>
        <NavLink 
          to="/calls" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <PhoneCall size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Power Hour
        </NavLink>
        <NavLink 
          to="/scraping" 
          className={({ isActive }) => `${sidebarStyles['nav-link']} ${isActive ? sidebarStyles.active : ''}`}
        >
          <Target size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Web Scraping
        </NavLink>
      </aside>

      <main className={mainStyles.main}>
        <Outlet context={{ mainStyles }} />
      </main>
      <ExitIntentPopup />
    </div>
  );
};

export default Layout;
