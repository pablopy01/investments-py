import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  BellRing, 
  Newspaper, 
  TrendingUp, 
  Settings,
  CircleDollarSign
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cashflow', label: 'Flujo de Caja', icon: CalendarRange },
    { id: 'alerts', label: 'Vencimientos y Alertas', icon: BellRing },
    { id: 'news', label: 'Noticias Portafolio', icon: Newspaper },
    { id: 'launches', label: 'Nuevas Emisiones', icon: TrendingUp },
    { id: 'manager', label: 'Mi Portafolio (CRUD)', icon: Settings },
  ];

  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  React.useEffect(() => {
    const updateCount = () => {
      const cnt = localStorage.getItem('unread_news_count');
      setUnreadCount(cnt ? parseInt(cnt) : 0);
    };

    updateCount();
    window.addEventListener('news-badge-update', updateCount);
    return () => {
      window.removeEventListener('news-badge-update', updateCount);
    };
  }, []);

  const handleItemClick = (itemId: string) => {
    if (itemId === 'news') {
      localStorage.setItem('unread_news_count', '0');
      setUnreadCount(0);
    }
    setView(itemId);
  };

  return (
    <aside style={styles.aside}>
      <div style={styles.logoContainer}>
        <CircleDollarSign size={32} color="var(--color-pyg)" />
        <div style={styles.logoTextContainer}>
          <span style={styles.logoTitle}>ASUNCIÓN</span>
          <span style={styles.logoSubTitle}>INVEST TRACKER</span>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              style={{
                ...styles.navButton,
                backgroundColor: isActive ? 'rgba(0, 210, 196, 0.1)' : 'transparent',
                borderColor: isActive ? 'rgba(0, 210, 196, 0.3)' : 'transparent',
                color: isActive ? 'var(--color-pyg)' : 'var(--text-secondary)',
              }}
              className="nav-btn"
            >
              <Icon size={20} style={{ color: isActive ? 'var(--color-pyg)' : 'inherit' }} />
              <span style={styles.navLabel}>{item.label}</span>
              
              {item.id === 'news' && unreadCount > 0 && (
                <div style={styles.newsBadgeCount}>{unreadCount}</div>
              )}
              
              {item.id === 'launches' && (
                <div style={styles.newLaunchLabel}>NUEVO</div>
              )}

              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <span style={styles.footerUser}>Pablo Vidal L. Moscarda</span>
        <span style={styles.footerRole}>Consultor de Inversiones</span>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  aside: {
    width: '280px',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    zIndex: 100,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
    padding: '4px',
  },
  logoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    fontFamily: 'var(--font-family-nums)',
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
    background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--color-pyg) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoSubTitle: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid transparent',
    fontSize: '0.925rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
    position: 'relative',
    width: '100%',
  },
  navLabel: {
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    height: '50%',
    width: '4px',
    backgroundColor: 'var(--color-pyg)',
    borderRadius: '0 4px 4px 0',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  footerUser: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  footerRole: {
    fontSize: '0.725rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
  },
  newsBadgeCount: {
    backgroundColor: 'var(--accent-coral)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    boxShadow: '0 0 10px rgba(255, 107, 107, 0.4)',
  },
  newLaunchLabel: {
    backgroundColor: 'rgba(0, 210, 196, 0.1)',
    color: 'var(--color-pyg)',
    border: '1px solid rgba(0, 210, 196, 0.3)',
    fontSize: '0.625rem',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
};
