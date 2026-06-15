import React, { useState, useEffect } from 'react';
import { MOCK_NEWS } from '../data/initialPortfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Newspaper, 
  Search, 
  ExternalLink,
  ThumbsUp, 
  Minus, 
  Building2,
  RefreshCw,
  Clock
} from 'lucide-react';
import type { NewsArticle } from '../types/portfolio';

export const NewsFeed: React.FC = () => {
  const { investments } = usePortfolio();
  
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'news' | 'x'>('all');

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // 1. Extract unique portfolio companies that have bonds or plazo fijos
  const portfolioCompanies = Array.from(
    new Set(
      investments
        .filter(i => i.type === 'bono' || i.type === 'plazo_fijo')
        .map(i => i.issuer)
    )
  );

  const loadNews = async () => {
    if (window.electronAPI) {
      try {
        const cached = await window.electronAPI.getRealNews();
        if (cached && cached.length > 0) {
          setNews(cached);
        } else {
          // Force sync on empty cache
          await handleSync();
        }
      } catch (err) {
        console.error('Failed to load news:', err);
        setNews(MOCK_NEWS);
      }
    } else {
      setNews(MOCK_NEWS);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (window.electronAPI) {
        const issuerNames = investments.map(i => i.issuer);
        const freshNews = await window.electronAPI.syncRealNews(issuerNames);
        setNews(freshNews);
        
        const now = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(now);
        localStorage.setItem('last_news_sync_time', now);
        localStorage.setItem('last_news_sync_date', new Date().toDateString());
        
        // Save count of unread/recent news to trigger badge notification in Sidebar
        localStorage.setItem('unread_news_count', '0');
        window.dispatchEvent(new Event('news-badge-update'));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setNews(MOCK_NEWS);
        const now = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(now);
      }
    } catch (err) {
      console.error('News sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadNews();
    
    const lastDate = localStorage.getItem('last_news_sync_date');
    const lastTime = localStorage.getItem('last_news_sync_time');
    setLastSyncTime(lastTime);
    
    // Auto-sync after 6 hours
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
    
    if (shouldAutoSync() && window.electronAPI) {
      handleSync();
    }
  }, []);

  // 2. Filter news articles
  const filteredNews = news.filter(article => {
    const matchesCompany = selectedCompany === 'all' || article.relatedCompanies.includes(selectedCompany);
    const matchesSentiment = sentimentFilter === 'all' || article.sentiment === sentimentFilter;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isX = article.isFromX || article.source.startsWith('X (') || article.source === 'X (vía Google)';
    const matchesSource = sourceFilter === 'all' || 
                          (sourceFilter === 'x' && isX) || 
                          (sourceFilter === 'news' && !isX);
                          
    return matchesCompany && matchesSentiment && matchesSearch && matchesSource;
  });

  const handleOpenLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    if (window.electronAPI) {
      window.electronAPI.openExternalLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Filtering Header panel */}
      <div className="glass-panel" style={styles.filterPanel}>
        <div style={styles.filterHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <Newspaper size={20} color="var(--color-pyg)" />
            <h3 style={styles.filterTitle}>Buscador y Monitoreo Diario de Noticias</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {lastSyncTime && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                Sincronizado: {lastSyncTime}
              </span>
            )}
            
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              style={{
                ...styles.syncButton,
                opacity: isSyncing ? 0.6 : 1,
                cursor: isSyncing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw 
                size={14} 
                className={isSyncing ? 'spin-anim' : ''} 
                style={{ 
                  animation: isSyncing ? 'spin 1s linear infinite' : 'none' 
                }} 
              />
              <span>{isSyncing ? 'Sincronizando...' : 'Actualizar Noticias'}</span>
            </button>
          </div>
        </div>

        <div style={styles.filterRow}>
          {/* Company filter */}
          <div style={styles.filterCol}>
            <label style={styles.label}>Filtrar por Empresa Emisora</label>
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={styles.select}
            >
              <option value="all">Todas las empresas en cartera</option>
              {portfolioCompanies.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          {/* Sentiment filter */}
          <div style={styles.filterCol}>
            <label style={styles.label}>Sentimiento del Mercado</label>
            <div style={styles.sentimentBtnGroup}>
              <button 
                onClick={() => setSentimentFilter('all')}
                style={{ 
                  ...styles.sentimentBtn, 
                  backgroundColor: sentimentFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: sentimentFilter === 'all' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Todos
              </button>
              <button 
                onClick={() => setSentimentFilter('positive')}
                style={{ 
                  ...styles.sentimentBtn, 
                  backgroundColor: sentimentFilter === 'positive' ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: sentimentFilter === 'positive' ? 'var(--color-usd)' : 'var(--text-secondary)'
                }}
              >
                <ThumbsUp size={12} /> Positivo
              </button>
              <button 
                onClick={() => setSentimentFilter('neutral')}
                style={{ 
                  ...styles.sentimentBtn, 
                  backgroundColor: sentimentFilter === 'neutral' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: sentimentFilter === 'neutral' ? 'var(--text-secondary)' : 'var(--text-secondary)'
                }}
              >
                <Minus size={12} /> Neutral
              </button>
            </div>
          </div>

          {/* Source filter */}
          <div style={styles.filterCol}>
            <label style={styles.label}>Fuente de Información</label>
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value as 'all' | 'news' | 'x')}
              style={styles.select}
            >
              <option value="all">Todas las fuentes</option>
              <option value="news">Noticias Financieras</option>
              <option value="x">Red Social 𝕏 (Twitter)</option>
            </select>
          </div>

          {/* Text search */}
          <div style={styles.filterCol}>
            <label style={styles.label}>Buscar palabras clave</label>
            <div style={styles.searchContainer}>
              <Search size={14} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Ej. exportación, planta, balance..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* News Feed Grid */}
      <div style={styles.feedGrid}>
        {filteredNews.map((article) => {
          const isX = article.isFromX || article.source.startsWith('X (') || article.source === 'X (vía Google)';
          return (
            <article key={article.id} className="glass-panel" style={styles.articleCard}>
              <div style={styles.articleMeta}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isX && (
                    <span style={styles.xBadge}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </span>
                  )}
                  <span style={{
                    ...styles.source,
                    color: isX ? 'var(--text-secondary)' : 'var(--color-pyg)'
                  }} className="financial-num">
                    {article.source}
                  </span>
                </div>
                <span style={styles.date} className="financial-num">{new Date(article.date).toLocaleDateString('es-PY')}</span>
              </div>

              <h4 style={styles.articleTitle}>{article.title}</h4>
              <p style={styles.summary}>{article.summary}</p>

              <div style={styles.articleFooter}>
                {/* Linked companies tags */}
                <div style={styles.tagsContainer}>
                  {article.relatedCompanies.map(comp => (
                    <span key={comp} style={styles.tag}>
                      <Building2 size={12} />
                      {comp}
                    </span>
                  ))}
                </div>

                {/* Sentiment badge */}
                <div style={styles.actionCol}>
                  <span 
                    style={{
                      ...styles.sentimentBadge,
                      backgroundColor: article.sentiment === 'positive' ? 'rgba(16,185,129,0.15)' : article.sentiment === 'negative' ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
                      color: article.sentiment === 'positive' ? 'var(--color-usd)' : article.sentiment === 'negative' ? 'var(--accent-coral)' : 'var(--text-secondary)',
                      borderColor: article.sentiment === 'positive' ? 'rgba(16,185,129,0.3)' : article.sentiment === 'negative' ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {article.sentiment === 'positive' ? 'Alza / Positivo' : article.sentiment === 'negative' ? 'Riesgo / Negativo' : 'Neutral'}
                  </span>

                  <a 
                    href={article.url} 
                    onClick={(e) => handleOpenLink(e, article.url)}
                    style={{
                      ...styles.linkBtn,
                      color: isX ? '#e1e8ed' : 'var(--color-pyg)'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>{isX ? 'Ver en 𝕏' : 'Leer Fuente'}</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}

        {filteredNews.length === 0 && (
          <div className="glass-panel" style={styles.emptyCard}>
            <p>No se encontraron noticias recientes asociadas a los criterios ingresados.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Tip: Intenta buscar otra palabra clave o selecciona "Todas las empresas".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '40px',
    marginLeft: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  filterPanel: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  filterTitle: {
    fontSize: '0.975rem',
    fontWeight: '700',
    color: '#fff',
  },
  filterRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  filterCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '220px',
  },
  label: {
    fontSize: '0.725rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  sentimentBtnGroup: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '2px',
    gap: '2px',
    height: '42px',
    alignItems: 'center',
  },
  sentimentBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    flex: 1,
    height: '100%',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'var(--transition-smooth)',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '10px 14px 10px 36px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  },
  feedGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  articleCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(12,15,23,0.7) 0%, rgba(7,9,14,0.7) 100%)',
  },
  articleMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  source: {
    color: 'var(--color-pyg)',
    fontWeight: '750',
    letterSpacing: '0.02em',
  },
  date: {
    color: 'var(--text-secondary)',
  },
  articleTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#fff',
    lineHeight: 1.3,
  },
  summary: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  articleFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    marginTop: '6px',
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
  },
  tag: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  actionCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sentimentBadge: {
    fontSize: '0.7rem',
    fontWeight: '750',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.775rem',
    fontWeight: '700',
    color: 'var(--color-pyg)',
    textDecoration: 'none',
    transition: 'var(--transition-smooth)',
  },
  emptyCard: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  syncButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  xBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '4px',
    padding: '3px 6px',
    height: '18px',
  },
};
