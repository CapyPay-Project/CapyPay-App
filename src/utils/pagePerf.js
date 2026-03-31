// Lightweight page-level performance helpers for client scripts.

function isPerfDebugEnabled() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("perf") === "1") return true;
  return localStorage.getItem("capypay_perf_debug") === "1";
}

export function createPagePerf(pageName) {
  const start = performance.now();
  const marks = [];
  const debug = isPerfDebugEnabled();

  function mark(name, data = {}) {
    const t = performance.now() - start;
    const row = { page: pageName, name, ms: Math.round(t), at: Date.now(), ...data };
    marks.push(row);

    if (debug) {
      console.log(`[perf:${pageName}] ${name} @ ${Math.round(t)}ms`, data);
    }
    return row;
  }

  function flush() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("capypay:page-perf", {
        detail: {
          page: pageName,
          totalMs: Math.round(performance.now() - start),
          marks,
        },
      }),
    );
  }

  return { mark, flush };
}

export async function withTimeout(promise, timeoutMs, label = "operation") {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function runWhenIdle(task, fallbackDelayMs = 1200) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => task(), { timeout: fallbackDelayMs });
    return;
  }
  window.setTimeout(task, fallbackDelayMs);
}
