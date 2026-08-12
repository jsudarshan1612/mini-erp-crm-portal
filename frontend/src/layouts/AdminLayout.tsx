import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  FileText,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    label: 'Dashboard',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
      },
    ],
  },
  {
    label: 'CRM',
    items: [{ to: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] }],
  },
  {
    label: 'Inventory',
    items: [
      {
        to: '/products',
        label: 'Products',
        icon: Package,
        roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
      },
      { to: '/stock', label: 'Stock', icon: Warehouse, roles: ['ADMIN', 'WAREHOUSE'] },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        to: '/challans',
        label: 'Challans',
        icon: FileText,
        roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
      },
    ],
  },
  {
    label: 'Administration',
    items: [{ to: '/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] }],
  },
];

export default function AdminLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasRole(...(item.roles as import('../types').Role[]))),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Mini ERP + CRM</h1>
          <p>Operations Portal</p>
        </div>
        <nav className="sidebar-nav">
          {visibleGroups.map((group) => (
            <div key={group.label} className="nav-section">
              <div className="nav-section-title">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
              Welcome, <strong>{user?.name}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-primary">{user?.role}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
