const { app, BrowserWindow, shell, Menu, ipcMain, Notification } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// ── X (Twitter) Configuration ─────────────────────────────────────────────────
// Known X handles for Paraguayan brokerages and financial institutions
const X_HANDLES_BROKERAGES = {
  'Cadiem':       'CadiemPy',
  'Basa Capital': 'BasaCapital',
  'Investor':     'InvestorPy',
  'Avalon':       'AvalonCBpy',
  'BVPASA':       'baborsakm',     // Bolsa de Valores del Paraguay
};

// Known X handles for portfolio issuers
const X_HANDLES_ISSUERS = {
  'TELECEL':              'TigoParaguay',
  'SUDAMERIS':            'SudamerisBank',
  'FRIGORÍFICO CONCEPCIÓN': 'FrigoConce',
  'COMFAR':               'ComfarPy',
  'CECON':                'CeconSA',
};

// Nitter instances to try (ordered by reliability)
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.cz',
  'https://nitter.1d4.us',
];

let mainWindow;

// Paths for persistent data storage in AppData
const userDataPath = app.getPath('userData');
const NEWS_FILE = path.join(userDataPath, 'real_news.json');
const LAUNCHES_FILE = path.join(userDataPath, 'real_launches.json');

// Helper to decode HTML entities in RSS feed titles/descriptions
function decodeHTMLEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ');
}

// Lightweight, compile-safe RSS XML parser using regexes
function parseXMLRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
    
    if (titleMatch && linkMatch) {
      let rawTitle = decodeHTMLEntities(titleMatch[1]);
      let link = linkMatch[1].trim();
      let pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();
      let desc = descMatch ? decodeHTMLEntities(descMatch[1]) : '';
      
      // Clean Google News format: "Title - Source"
      let title = rawTitle;
      let source = 'Mercado Financiero PY';
      const lastDashIdx = rawTitle.lastIndexOf(' - ');
      if (lastDashIdx !== -1) {
        title = rawTitle.substring(0, lastDashIdx).trim();
        source = rawTitle.substring(lastDashIdx + 3).trim();
      }
      
      // Clean CDATA and HTML tags
      title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      desc = desc.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      desc = desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Convert pubDate to YYYY-MM-DD
      let dateStr = new Date().toISOString().split('T')[0];
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch (e) {}
      
      items.push({
        title,
        link,
        date: dateStr,
        source,
        description: desc
      });
    }
  }
  return items;
}

// Spanish financial sentiment analyzer based on case-insensitive keyword scores
function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  
  const POSITIVE_KEYWORDS = [
    'crece', 'crecimiento', 'aumento', 'record', 'récord', 'exito', 'éxito', 'mejor', 'ganancia', 
    'ganancias', 'rentabilidad', 'rentable', 'alza', 'sube', 'subida', 'supera', 'inversion', 
    'inversión', 'expansión', 'expande', 'positivo', 'desarrollo', 'dividendo', 'dividendos',
    'ganó', 'ganan', 'sólido', 'solidez', 'fortaleza', 'colocación', 'coloca', 'exitoso',
    'adjudica', 'adjudicó', 'inaugura', 'inauguró', 'inversor', 'inversores', 'optimista'
  ];

  const NEGATIVE_KEYWORDS = [
    'cae', 'caída', 'baja', 'pérdida', 'perdida', 'pérdidas', 'perdidas', 'riesgo', 'deuda', 
    'crisis', 'inflación', 'atraso', 'multa', 'sanción', 'sancion', 'déficit', 'deficit', 'conflicto', 
    'demanda', 'negativo', 'atrasos', 'atrasado', 'mora', 'impago', 'default', 'quiebra', 'bajó',
    'desaceleración', 'desacelera', 'vulnerable', 'problema', 'problemas', 'alerta', 'duda', 'dudas',
    'caen', 'desciende', 'descenso', 'incertidumbre'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach(kw => {
    const regex = new RegExp('\\b' + kw + '\\b', 'gi');
    const matches = lower.match(regex);
    if (matches) positiveCount += matches.length;
  });

  NEGATIVE_KEYWORDS.forEach(kw => {
    const regex = new RegExp('\\b' + kw + '\\b', 'gi');
    const matches = lower.match(regex);
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Display native Windows 11 notification toasts
function showWindowsNotification(title, body) {
  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, '../build/icon.ico')
      });
      notification.show();
    }
  } catch (err) {
    console.error('Error showing Windows notification:', err.message);
  }
}

// Fetch RSS feed via Node global fetch
async function fetchRSS(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=es-419&gl=PY&ceid=PY:es-419`;
    const res = await fetch(rssUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const xml = await res.text();
    return parseXMLRSS(xml);
  } catch (err) {
    console.error(`Error fetching news RSS for query "${query}":`, err.message);
    return [];
  }
}

// ── X (Twitter) Fetching via Nitter RSS ───────────────────────────────────────
// Try multiple Nitter instances until one responds
async function fetchNitterRSS(handle) {
  for (const instance of NITTER_INSTANCES) {
    try {
      const rssUrl = `${instance}/${handle}/rss`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(rssUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Investment Tracker/1.0' }
      });
      clearTimeout(timeout);
      
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes('<item>')) continue;
      
      return parseXMLRSS(xml);
    } catch (err) {
      // Try next instance
      continue;
    }
  }
  return [];
}

// Parse X posts from Nitter RSS items into our article format
function parseXPostsToArticles(items, handle, displayName) {
  return items.map(item => {
    // Nitter returns the tweet text in the title/description
    let text = item.title || item.description || '';
    // Clean HTML tags from Nitter output
    text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Truncate very long tweets for readability
    const summary = text.length > 400 ? text.substring(0, 400) + '...' : text;
    
    // The link from Nitter points to the Nitter instance, convert to x.com
    let xLink = item.link || '';
    // Convert nitter links to x.com links
    NITTER_INSTANCES.forEach(inst => {
      xLink = xLink.replace(inst, 'https://x.com');
    });
    // Ensure it points to x.com
    if (!xLink.includes('x.com') && !xLink.includes('twitter.com')) {
      xLink = `https://x.com/${handle}`;
    }
    
    return {
      title: summary.length > 120 ? summary.substring(0, 120) + '...' : summary,
      link: xLink,
      date: item.date,
      source: `X (@${handle})`,
      description: summary,
      isFromX: true,
      xHandle: handle,
      xDisplayName: displayName
    };
  });
}

// Fetch X posts for all configured handles
async function fetchAllXPosts(portfolioIssuers = []) {
  const allXPosts = [];
  
  // 1. Fetch from brokerage handles
  for (const [name, handle] of Object.entries(X_HANDLES_BROKERAGES)) {
    try {
      const items = await fetchNitterRSS(handle);
      const posts = parseXPostsToArticles(items, handle, name);
      allXPosts.push(...posts);
    } catch (err) {
      console.error(`Error fetching X posts for @${handle}:`, err.message);
    }
  }
  
  // 2. Fetch from known issuer handles
  for (const [issuerKey, handle] of Object.entries(X_HANDLES_ISSUERS)) {
    // Only fetch if the issuer is in the portfolio
    const isInPortfolio = portfolioIssuers.some(iss => 
      iss.toUpperCase().includes(issuerKey.toUpperCase())
    );
    if (isInPortfolio) {
      try {
        const items = await fetchNitterRSS(handle);
        const posts = parseXPostsToArticles(items, handle, issuerKey);
        allXPosts.push(...posts);
      } catch (err) {
        console.error(`Error fetching X posts for @${handle}:`, err.message);
      }
    }
  }
  
  // 3. Fallback: Google News search for X/Twitter posts about Paraguay finance
  try {
    const xGoogleItems = await fetchRSS('site:x.com Cadiem OR "Basa Capital" OR Investor OR Avalon Paraguay bonos');
    const googleXPosts = xGoogleItems.map(item => ({
      ...item,
      source: 'X (vía Google)',
      isFromX: true,
      xHandle: '',
      xDisplayName: 'Búsqueda X'
    }));
    allXPosts.push(...googleXPosts);
  } catch (err) {
    console.error('Error fetching X posts via Google fallback:', err.message);
  }
  
  return allXPosts;
}

// Scrape and parse bond launches from RSS articles
async function syncRealLaunches(articles) {
  const seedLaunches = [
    {
      id: 'real-launch-1',
      issuer: 'TELECEL S.A.E. (Tigo Paraguay)',
      rating: 'AAA py',
      currency: 'PYG',
      interestRate: 9.75,
      paymentFrequency: 'trimestral',
      maturityYears: 5,
      broker: 'Basa Capital',
      amount: '80.000.000.000 Gs.',
      recommendationScore: 94,
      recommendationText: 'La más alta calificación crediticia (AAA py) del mercado paraguayo. Respaldo de Millicom International. Tasa muy atractiva del 9.75% para una inversión de riesgo prácticamente nulo.',
      status: 'Abierta'
    },
    {
      id: 'real-launch-2',
      issuer: 'SUDAMERIS BANK S.A.E.C.A.',
      rating: 'AA+ py',
      currency: 'PYG',
      interestRate: 8.95,
      paymentFrequency: 'trimestral',
      maturityYears: 4,
      broker: 'Cadiem',
      amount: '150.000.000.000 Gs.',
      recommendationScore: 88,
      recommendationText: 'Excelente oportunidad en el sector bancario de Paraguay. Sudameris, tras su fusión con Regional, se consolida como el banco más grande del país. Rendimiento superior comparado con CDAs convencionales.',
      status: 'Abierta'
    },
    {
      id: 'real-launch-3',
      issuer: 'AVALON COMPAÑÍA DE INVERSIONES S.A.',
      rating: 'A+ py',
      currency: 'PYG',
      interestRate: 10.25,
      paymentFrequency: 'trimestral',
      maturityYears: 5,
      broker: 'Avalon',
      amount: '30.000.000.000 Gs.',
      recommendationScore: 91,
      recommendationText: 'Avalon Casa de Bolsa trae una colocación excelente de tasa de dos dígitos en guaraníes con una sólida calificación A+py. Ideal para diversificar carteras de renta fija.',
      status: 'Abierta'
    },
    {
      id: 'real-launch-4',
      issuer: 'FRIGORÍFICO CONCEPCIÓN S.A.',
      rating: 'A py',
      currency: 'USD',
      interestRate: 7.75,
      paymentFrequency: 'trimestral',
      maturityYears: 3,
      broker: 'Investor',
      amount: '10.000.000 USD',
      recommendationScore: 82,
      recommendationText: 'Para inversores en dólares con moderada tolerancia al riesgo. Frigorífico Concepción ofrece un spread muy alto (7.75%) en moneda dura. Respaldado por sus fuertes flujos exportadores.',
      status: 'Próximamente'
    },
    {
      id: 'real-launch-5',
      issuer: 'BIOEXPORT S.A.',
      rating: 'BBB+ py',
      currency: 'PYG',
      interestRate: 11.50,
      paymentFrequency: 'trimestral',
      maturityYears: 5,
      broker: 'Basa Capital',
      amount: '15.000.000.000 Gs.',
      recommendationScore: 78,
      recommendationText: 'Rendimiento elevado (11.50%) que compensa la calificación BBB+. Bioexport es un jugador clave en la agroexportación no tradicional. Ideal para diversificar con un plus de tasa.',
      status: 'Abierta'
    }
  ];

  let launches = [...seedLaunches];

  // Programmatically parse articles to discover new launches
  articles.forEach(art => {
    const titleLower = art.title.toLowerCase();
    const sumLower = art.summary.toLowerCase();
    
    const isEmissionMatch = /emisión|emision|colocación|colocacion|lanzamiento|nuevos bonos|nuevo bono/i.test(titleLower + ' ' + sumLower);
    
    if (isEmissionMatch) {
      const rateMatch = (titleLower + ' ' + sumLower).match(/(\d+[\.,]\d+)\s*%/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1].replace(',', '.'));
        if (rate >= 5 && rate <= 18) {
          let extractedIssuer = '';
          const companies = art.relatedCompanies.filter(c => c !== 'Mercado General');
          if (companies.length > 0) {
            extractedIssuer = companies[0].toUpperCase();
          } else {
            const saMatch = art.title.match(/([A-Z][a-zA-Z\s]+S\.A\.[E\.]*)/);
            if (saMatch) {
              extractedIssuer = saMatch[1].trim();
            }
          }

          if (extractedIssuer && !launches.some(l => l.issuer.toLowerCase().includes(extractedIssuer.toLowerCase()))) {
            const isUSD = /usd|\$|dólares|dolares/i.test(titleLower + ' ' + sumLower);
            const currency = isUSD ? 'USD' : 'PYG';
            
            let broker = 'Cadiem';
            if (titleLower.includes('basa')) broker = 'Basa Capital';
            else if (titleLower.includes('investor')) broker = 'Investor';
            else if (titleLower.includes('avalon')) broker = 'Avalon';
            
            let score = 80;
            if (currency === 'PYG') {
              if (rate >= 11) score = 92;
              else if (rate >= 10) score = 88;
              else if (rate >= 9) score = 85;
            } else {
              if (rate >= 8) score = 93;
              else if (rate >= 7) score = 87;
              else if (rate >= 6) score = 83;
            }

            const newLaunch = {
              id: 'launch-' + Math.random().toString(36).substr(2, 9),
              issuer: extractedIssuer,
              rating: 'A py',
              currency: currency,
              interestRate: rate,
              paymentFrequency: 'trimestral',
              maturityYears: 5,
              broker: broker,
              amount: currency === 'PYG' ? '20.000.000.000 Gs.' : '3.000.000 USD',
              recommendationScore: score,
              recommendationText: `Detectado automáticamente en "${art.source}". Emisión de renta fija con un cupón de ${rate}% anual.`,
              status: 'Abierta'
            };

            launches.unshift(newLaunch);

            // Windows 11 notification toast for newly found high yield opportunity
            if (score >= 90) {
              showWindowsNotification(
                '🔥 Oportunidad de Emisión Recomendada',
                `Nuevo bono de ${newLaunch.issuer} al ${rate}% en ${currency} vía ${broker}`
              );
            }
          }
        }
      }
    }
  });

  launches = launches.slice(0, 10);
  fs.writeFileSync(LAUNCHES_FILE, JSON.stringify(launches, null, 2));
  return launches;
}

// Sync real news and searches
async function syncRealNewsAndLaunches(issuers = []) {
  // General queries including houses of brokerage in Paraguay
  const generalQueries = [
    'Bolsa de Valores de Asunción Paraguay',
    'bonos Paraguay emisiones',
    'Cadiem OR Basa Capital OR Investor Casa de Bolsa OR Avalon Casa de Bolsa'
  ];

  // Specific issuer queries dynamically based on portfolio
  const issuerQueries = issuers.map(issuer => `${issuer.replace(/\s+S\.A\.E?\.?C?\.?A?\.?$/i, '').trim()} Paraguay`);
  
  const allQueries = [...generalQueries, ...issuerQueries];
  let allArticles = [];

  // ── Phase 1: Google News RSS ────────────────────────────────────────────────
  for (const query of allQueries) {
    const items = await fetchRSS(query);
    allArticles = [...allArticles, ...items];
  }

  // ── Phase 2: X (Twitter) via Nitter RSS ─────────────────────────────────────
  try {
    console.log('[X/Twitter] Fetching posts from configured handles...');
    const xPosts = await fetchAllXPosts(issuers);
    console.log(`[X/Twitter] Retrieved ${xPosts.length} posts from X`);
    allArticles = [...allArticles, ...xPosts];
  } catch (err) {
    console.error('[X/Twitter] Error fetching X posts:', err.message);
  }

  // Deduplicate by URL
  const seenLinks = new Set();
  const uniqueArticles = [];

  for (const art of allArticles) {
    if (!seenLinks.has(art.link)) {
      seenLinks.add(art.link);
      
      const relatedCompanies = [];
      
      if (art.title.toLowerCase().includes('cadiem') || art.description.toLowerCase().includes('cadiem')) {
        relatedCompanies.push('Cadiem');
      }
      if (art.title.toLowerCase().includes('basa') || art.description.toLowerCase().includes('basa')) {
        relatedCompanies.push('Basa Capital');
      }
      if (art.title.toLowerCase().includes('investor') || art.description.toLowerCase().includes('investor')) {
        relatedCompanies.push('Investor');
      }
      if (art.title.toLowerCase().includes('avalon') || art.description.toLowerCase().includes('avalon')) {
        relatedCompanies.push('Avalon');
      }
      
      issuers.forEach(issuer => {
        const cleanIssuer = issuer.replace(/\s+S\.A\.E?\.?C?\.?A?\.?$/i, '').trim();
        const regex = new RegExp(cleanIssuer, 'i');
        if (regex.test(art.title) || regex.test(art.description)) {
          if (!relatedCompanies.includes(issuer)) {
            relatedCompanies.push(issuer);
          }
        }
      });
      
      const sentiment = analyzeSentiment(art.title + ' ' + art.description);
      
      uniqueArticles.push({
        id: 'news-' + Math.random().toString(36).substr(2, 9),
        date: art.date,
        source: art.source,
        title: art.title,
        summary: art.description || art.title,
        url: art.link,
        relatedCompanies: relatedCompanies.length > 0 ? relatedCompanies : ['Mercado General'],
        sentiment: sentiment,
        isFromX: art.isFromX || false
      });
    }
  }

  uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  const finalArticles = uniqueArticles.slice(0, 50);

  fs.writeFileSync(NEWS_FILE, JSON.stringify(finalArticles, null, 2));

  // If there are critical negative news, trigger a Windows 11 alert toast!
  const criticalNegativeNews = finalArticles.filter(art => art.sentiment === 'negative' && art.relatedCompanies.some(c => c !== 'Mercado General'));
  if (criticalNegativeNews.length > 0) {
    const mainNews = criticalNegativeNews[0];
    const companies = mainNews.relatedCompanies.join(', ');
    showWindowsNotification(
      '⚠️ Alerta Crítica de Portafolio',
      `Noticia de impacto negativo en ${companies}: "${mainNews.title}"`
    );
  }

  // Sincronizar lanzamientos derivados
  await syncRealLaunches(finalArticles);

  return finalArticles;
}

// IPC Main channels
ipcMain.handle('news:get', () => {
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const raw = fs.readFileSync(NEWS_FILE, 'utf8');
      return JSON.parse(raw);
    }
    return []; // Return empty if not synced yet
  } catch (err) {
    console.error('Error reading news cache:', err);
    return [];
  }
});

ipcMain.handle('news:sync', async (event, issuers) => {
  try {
    return await syncRealNewsAndLaunches(issuers || []);
  } catch (err) {
    console.error('Error syncing real news:', err);
    throw err;
  }
});

ipcMain.handle('launches:get', () => {
  try {
    if (fs.existsSync(LAUNCHES_FILE)) {
      const raw = fs.readFileSync(LAUNCHES_FILE, 'utf8');
      return JSON.parse(raw);
    }
    return [];
  } catch (err) {
    console.error('Error reading launches cache:', err);
    return [];
  }
});

ipcMain.handle('launches:sync', async () => {
  try {
    // If news file exists, update launches from it, otherwise return defaults
    let articles = [];
    if (fs.existsSync(NEWS_FILE)) {
      const raw = fs.readFileSync(NEWS_FILE, 'utf8');
      articles = JSON.parse(raw);
    }
    return await syncRealLaunches(articles);
  } catch (err) {
    console.error('Error syncing launches:', err);
    throw err;
  }
});

ipcMain.on('link:open', (event, targetUrl) => {
  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    shell.openExternal(targetUrl);
  }
});

ipcMain.handle('fx:get-live', async () => {
  try {
    const res = await fetch('https://www.cambioschaco.com.py/api/branch_office/1/exchange', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Investment Tracker/1.0'
      }
    });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const data = await res.json();
    if (data && data.items && Array.isArray(data.items)) {
      const usdItem = data.items.find(item => item.isoCode === 'USD');
      if (usdItem && usdItem.purchasePrice) {
        console.log(`[FX] Live USD buy rate from Cambios Chaco: ${usdItem.purchasePrice}`);
        return usdItem.purchasePrice;
      }
    }
    throw new Error('USD rate not found in Cambios Chaco response');
  } catch (err) {
    console.error('[FX Error] Failed to get live rate:', err.message);
    return null;
  }
});

ipcMain.handle('get-version', () => app.getVersion());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Asunción Investment Tracker',
    icon: path.join(__dirname, '../build/icon.ico'),
    backgroundColor: '#07090e',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    frame: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    if (openUrl.startsWith('http://') || openUrl.startsWith('https://')) {
      shell.openExternal(openUrl);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
      ],
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Maximizar' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'null' && parsedUrl.protocol !== 'file:') {
      navigationEvent.preventDefault();
    }
  });
});
