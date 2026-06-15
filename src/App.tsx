import React, { useState, useEffect } from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CashFlow } from './components/CashFlow';
import { Alerts } from './components/Alerts';
import { NewsFeed } from './components/NewsFeed';
import { BondLaunches } from './components/BondLaunches';
import { InvestmentManager } from './components/InvestmentManager';

const AppContent: React.FC = () => {
  const [currentView, setView] = useState<string>('dashboard');
  const { investments } = usePortfolio();

  useEffect(() => {
    const lastDate = localStorage.getItem('last_news_sync_date');
    const lastTime = localStorage.getItem('last_news_sync_time');
    
    const shouldAutoSync = () => {
      if (!lastDate) return true;
      try {
        const lastSync = new Date(`${lastDate} ${lastTime || '00:00:00'}`);
        const diffMs = new Date().getTime() - lastSync.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 6;
      } catch (e) {
        return true;
      }
    };

    const api = window.electronAPI;
    if (shouldAutoSync() && api) {
      const runBgSync = async () => {
        try {
          const issuerNames = investments.map(i => i.issuer);
          await api.syncRealNews(issuerNames);
          
          const now = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('last_news_sync_time', now);
          localStorage.setItem('last_news_sync_date', new Date().toDateString());
          
          // Set unread count for sidebar notification badge
          localStorage.setItem('unread_news_count', '4');
          window.dispatchEvent(new Event('news-badge-update'));
        } catch (e) {
          console.error('Background news sync failed:', e);
        }
      };
      runBgSync();
    }
  }, []);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'cashflow':
        return <CashFlow />;
      case 'alerts':
        return <Alerts />;
      case 'news':
        return <NewsFeed />;
      case 'launches':
        return <BondLaunches />;
      case 'manager':
        return <InvestmentManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <Sidebar currentView={currentView} setView={setView} />
      
      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {/* Header */}
        <Header />
        
        {/* Active View Container */}
        <main style={styles.viewContainer}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  viewContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
};

export default App;
