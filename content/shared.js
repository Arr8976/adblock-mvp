(() => {
  const SITE = location.hostname.includes("chzzk")
    ? "chzzk"
    : location.hostname.includes("youtube") || location.hostname.includes("youtu.be")
      ? "youtube"
      : "other";

  const DEFAULTS = { enabled: true, youtube: true, chzzk: true, blockCount: 0 };

  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULTS, (v) => resolve({ ...DEFAULTS, ...v }));
    });
  }

  function bumpCount(n = 1) {
    chrome.storage.local.get({ sessionBlocks: 0 }, (v) => {
      chrome.storage.local.set({ sessionBlocks: (v.sessionBlocks || 0) + n });
    });
  }

  function hideEl(el, reason) {
    if (!el || el.dataset.adblockMvp === "1") return false;
    el.dataset.adblockMvp = "1";
    el.classList.add("adblock-mvp-hide");
    if (reason) el.setAttribute("title", `Adblock MVP: ${reason}`);
    bumpCount(1);
    return true;
  }

  function hideMatches(root, selectors, reason) {
    let n = 0;
    for (const sel of selectors) {
      try {
        root.querySelectorAll(sel).forEach((el) => {
          if (hideEl(el, reason || sel)) n += 1;
        });
      } catch (_) {
        /* invalid selector in older pages */
      }
    }
    return n;
  }

  function watchDom(run, quietMs = 800) {
    let t = null;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(run, quietMs);
    };
    const start = () => {
      run();
      const mo = new MutationObserver(schedule);
      const attach = () => {
        if (!document.documentElement) return requestAnimationFrame(attach);
        mo.observe(document.documentElement, { childList: true, subtree: true });
      };
      attach();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }

  function clickIfPresent(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && typeof el.click === "function") {
        el.click();
        bumpCount(1);
        return true;
      }
    }
    return false;
  }

  window.__adblockMvp = {
    SITE,
    getSettings,
    hideEl,
    hideMatches,
    watchDom,
    clickIfPresent,
    bumpCount,
  };
})();
