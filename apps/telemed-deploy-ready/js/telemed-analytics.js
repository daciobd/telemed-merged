;(() => {
  const LS_EVENTS   = 'telemed_analytics';
  const LS_FEEDBACK = 'telemed_feedbacks';
  const MAX_EVENTS  = 1000;
  const BANNER_TTL_DAYS = 7;

  const nowISO = () => new Date().toISOString();
  const ua     = () => navigator.userAgent || 'unknown';

  function safeParse(str, fallback) {
    try { return JSON.parse(str) ?? fallback } catch { return fallback }
  }
  function readArr(key){ return safeParse(localStorage.getItem(key), []) }
  function writeArr(key, arr){
    while (arr.length > MAX_EVENTS) arr.shift();
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function track(event, data = {}) {
    const rec = {
      event,
      data: data || {},
      timestamp: nowISO(),
      userAgent: ua(),
      page: location.pathname || '/'
    };
    const arr = readArr(LS_EVENTS);
    arr.push(rec);
    writeArr(LS_EVENTS, arr);

    // Google Analytics (se existir)
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', event, { ...data, page_location: location.href }); } catch {}
    }
    // console.debug('[telemed.track]', rec);
    return rec;
  }

  const feedback = {
    save({ rating, quickOptions = [], comments = '' }) {
      const rec = {
        rating: Number(rating),
        quickOptions: Array.isArray(quickOptions) ? quickOptions : [],
        comments: String(comments || ''),
        timestamp: nowISO(),
        userAgent: ua(),
        url: location.href
      };
      const arr = readArr(LS_FEEDBACK);
      arr.push(rec);
      writeArr(LS_FEEDBACK, arr);
      track('feedback_saved', { rating: rec.rating, quickOptions: rec.quickOptions });
      return rec;
    },
    all(){ return readArr(LS_FEEDBACK) },
    clear(){ localStorage.removeItem(LS_FEEDBACK) }
  };

  // Banner flags
  function bannerDismiss(){
    localStorage.setItem('telemed_banner_dismissed','true');
    localStorage.setItem('telemed_banner_dismissed_date', nowISO());
  }
  function bannerShouldShow(){
    const dismissed = localStorage.getItem('telemed_banner_dismissed') === 'true';
    if (!dismissed) return true;
    const dt = new Date(localStorage.getItem('telemed_banner_dismissed_date') || 0);
    const diff = (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= BANNER_TTL_DAYS;
  }

  // Utilidades
  function all(){ return readArr(LS_EVENTS) }
  function clear(){ localStorage.removeItem(LS_EVENTS) }

  // Download JSON (função bônus)
  function downloadJSON() {
    const data = {
      analytics: all(),
      feedback: feedback.all(),
      exportedAt: nowISO(),
      summary: {
        totalEvents: all().length,
        totalFeedbacks: feedback.all().length
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemed-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    track('analytics_download', { events: data.totalEvents, feedbacks: data.totalFeedbacks });
  }

  // Export público
  window.telemedAnalytics = { track, feedback, all, clear, bannerDismiss, bannerShouldShow, downloadJSON };

  // Debug helpers solicitados
  window.telemedDebug = {
    testBanner(){ 
      localStorage.removeItem('telemed_banner_dismissed');
      localStorage.removeItem('telemed_banner_dismissed_date');
      window.dispatchEvent(new CustomEvent('telemed:show-banner'));
    },
    testModal(){ window.dispatchEvent(new CustomEvent('telemed:show-feedback')); },
    showModal(){ window.dispatchEvent(new CustomEvent('telemed:show-feedback')); },
    hideModal(){ window.dispatchEvent(new CustomEvent('telemed:hide-feedback')); },
    download(){ downloadJSON(); },
    inspect(){
      console.group('📊 TeleMed Analytics Debug');
      console.table(all());
      console.group('💬 Feedback');
      console.table(feedback.all());
      console.groupEnd();
      console.groupEnd();
    }
  };

  // Evento de pageview
  track('page_open', { page: location.pathname });
})();