const vitalsByPage = new Map();

function toRounded(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function ensurePageState(pageName) {
  if (!vitalsByPage.has(pageName)) {
    vitalsByPage.set(pageName, {
      page: pageName,
      startedAt: Date.now(),
      metrics: {}
    });
  }
  return vitalsByPage.get(pageName);
}

function publishMetric(pageName, metricName, value, extra = {}) {
  const state = ensurePageState(pageName);
  state.metrics[metricName] = {
    value,
    at: new Date().toISOString(),
    ...extra
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('capypay-web-vitals', {
      detail: {
        page: pageName,
        metric: metricName,
        value,
        ...extra
      }
    }));
  }

  // Telemetria local para comparar before/after en Sprint 7.3.
  console.info('[CapyPay][WebVitals]', pageName, metricName, value, extra);
}

function observePaint(pageName) {
  if (typeof PerformanceObserver !== 'function') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          publishMetric(pageName, 'FCP', toRounded(entry.startTime), { unit: 'ms' });
        }
      });
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch (_e) {
    // Browser sin soporte para observer de paint.
  }
}

function observeLcp(pageName) {
  if (typeof PerformanceObserver !== 'function') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        publishMetric(pageName, 'LCP', toRounded(last.startTime), { unit: 'ms' });
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_e) {
    // Browser sin soporte para observer de LCP.
  }
}

function observeCls(pageName) {
  if (typeof PerformanceObserver !== 'function') return;

  let clsValue = 0;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += Number(entry.value || 0);
        }
      }
      publishMetric(pageName, 'CLS', toRounded(clsValue, 4));
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (_e) {
    // Browser sin soporte para observer de CLS.
  }
}

function observeInp(pageName) {
  if (typeof PerformanceObserver !== 'function') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const first = entries[0];
      if (!first) return;
      const value = Number(first.duration || first.processingEnd - first.startTime || 0);
      publishMetric(pageName, 'INP', toRounded(value), { unit: 'ms' });
    });
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (_e) {
    // Browser sin soporte para observer de event timing.
  }
}

function capturePageReady(pageName) {
  const now = performance?.now?.() || 0;
  publishMetric(pageName, 'PAGE_READY', toRounded(now), { unit: 'ms' });
}

export function setupPageWebVitals(pageName) {
  const safePage = String(pageName || 'unknown_page');
  ensurePageState(safePage);
  observePaint(safePage);
  observeLcp(safePage);
  observeCls(safePage);
  observeInp(safePage);

  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      capturePageReady(safePage);
    } else {
      window.addEventListener('DOMContentLoaded', () => capturePageReady(safePage), { once: true });
    }
  }
}

export function getPageWebVitalsSnapshot(pageName) {
  const safePage = String(pageName || 'unknown_page');
  return vitalsByPage.get(safePage) || null;
}
