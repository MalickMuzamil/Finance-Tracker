import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  WalletCards,
  ArrowLeftRight,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const links = [
    ['/', 'Dashboard', LayoutDashboard],
    ['/vehicles', 'Vehicles', Car],
    ['/finance', 'Home Finance', WalletCards],
    ['/lend', 'Len Den', ArrowLeftRight],
  ];

  if (user?.role === 'SUPER_ADMIN') {
    links.push(['/admin', 'Users', Users]);
  }

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const getPageEyebrow = () => {
    const p = location.pathname;
    if (p === '/') return 'PERSONAL OVERVIEW';
    if (p.startsWith('/vehicles')) return 'VEHICLE EXPENSES';
    if (p.startsWith('/finance')) return 'HOME FINANCE';
    if (p.startsWith('/lend')) return 'UDHAAR / LEN DEN';
    if (p.startsWith('/admin')) return 'ADMINISTRATION';
    return 'PERSONAL FINANCE';
  };

  return (
    <div className="app">
      {/* Desktop & Tablet Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          Fin<span>ance</span>
          <small>TRACKER</small>
        </div>

        <nav className="navLinks">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={18} className="navIcon" />
              <span className="navText">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebarFooter">
          <div className="userMiniCard">
            <div className="avatarMini">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="userInfo">
              <span className="userName">{user?.name}</span>
              <span className="userRole">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Active User'}</span>
            </div>
          </div>
          <button type="button" className="logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="mobileHeader">
        <div className="mobileBrand">
          Fin<span>ance</span> <small>PKR</small>
        </div>
        <div className="mobileHeaderRight">
          <button
            type="button"
            className="mobileMenuBtn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="mobileDrawerOverlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobileDrawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawerHead">
              <div className="brand">
                Fin<span>ance</span>
                <small>TRACKER</small>
              </div>
              <button
                type="button"
                className="iconBtn closeBtn"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawerUserCard">
              <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <strong>{user?.name}</strong>
                <p>{user?.email}</p>
                <span className="pill">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}</span>
              </div>
            </div>

            <nav className="drawerNav">
              {links.map(([to, label, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              className="logout drawerLogout"
              onClick={() => {
                setMobileDrawerOpen(false);
                handleLogout();
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mainContent">
        <header className="topbar">
          <div>
            <p className="eyebrow">{getPageEyebrow()}</p>
            <h1>Good to see you, {user?.name}</h1>
          </div>
          <div className="topbarRight">
            <div className="pkrCurrencyBadge">PKR (₨)</div>
            <div className="avatar" title={user?.email}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
