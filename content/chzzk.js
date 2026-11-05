(() => {
  function injectInline() {
    try {
      const s = document.createElement("script");
      s.src = chrome.runtime.getURL("content/chzzk-inject.js");
      s.async = false;
      (document.documentElement || document.head || document).appendChild(s);
      s.onload = () => s.remove();
    } catch (e) {
      console.warn("[Adblock MVP] inject failed", e);
    }
  }
  injectInline();

  (async () => {
    const api = window.__adblockMvp;
    if (!api) return;

    const settings = await api.getSettings();
    if (!settings.enabled || !settings.chzzk) {
      console.info("[Adblock MVP] CHZZK DOM hide off (settings)");
      return;
    }

    const SELECTORS = [
      '[class*="live_ad"]',
      '[class*="LiveAd"]',
      '[class*="banner_ad"]',
      '[class*="BannerAd"]',
      '[class*="chat_ad"]',
      '[class*="ChatAd"]',
      '[class*="catch_banner"]',
      '[class*="CatchBanner"]',
      '[class*="ChatCatch"]',
      '[class*="chat_catch"]',
      '[class*="instream"]',
      '[class*="Instream"]',
      '[class*="pre_roll"]',
      '[class*="mid_roll"]',
      '[class*="Midroll"]',
      '[class*="Preroll"]',
      '[class*="gfp_"]',
      '[class*="Gfp"]',
      '[class*="glad_"]',
      '[class*="tveta"]',
      '[id*="google_ads"]',
      '[id*="live_end_banner"]',
      '[class*="end_banner"]',
      '[class*="EndBanner"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'iframe[src*="ad.naver"]',
      'iframe[src*="ads.naver"]',
      'iframe[src*="veta.naver"]',
      'iframe[src*="pagead"]',
      'iframe[src*="tivan.naver"]',
      'div[data-ad]',
      'div[data-ads]',
      '[class*="advert" i]',
      '[class*="Advert"]',
    ];

    const ADBLOCK_HINT = /광고\s*차단\s*프로그램|광고차단/;

    function dismissAdblockPopup() {
      const roots = document.querySelectorAll(
        '[role="alertdialog"], [class*="popup_"], [class*="modal_"], [class*="Modal"], dialog'
      );
      const candidates = roots.length
        ? Array.from(roots)
        : Array.from(document.querySelectorAll("div")).filter((d) => {
            const t = d.textContent || "";
            return t.length < 800 && ADBLOCK_HINT.test(t);
          });

      for (const root of candidates) {
        if (root.dataset.adblockMvpPopup === "1") continue;
        const text = (root.textContent || "").replace(/\s+/g, " ");
        if (!ADBLOCK_HINT.test(text)) continue;

        root.dataset.adblockMvpPopup = "1";
        const scope = root.closest('[class*="popup"]') || root.parentElement || root;
        for (const btn of scope.querySelectorAll("button, [role='button'], a")) {
          const label = (btn.textContent || "").replace(/\s+/g, " ").trim();
          if (label === "확인") {
            try {
              btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));
              btn.click();
            } catch {}
            break;
          }
        }
        setTimeout(() => {
          if (!document.contains(scope)) return;
          try {
            (scope.closest('[class*="dimmed"]') || scope).remove();
          } catch {
            api.hideEl(scope, "chzzk:adblock-popup");
          }
        }, 150);
        api.bumpCount(1);
        console.info("[Adblock MVP] dismissed CHZZK adblock detect popup");
      }
    }

    function isSkipControl(el) {
      const aria = (el.getAttribute("aria-label") || "").trim();
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/광고\s*SKIP|광고\s*스킵|Skip\s*Ad/i.test(aria)) return true;
      if (/^(광고\s*)?(SKIP|스킵|건너뛰기)$/i.test(t)) return true;
      if (/\d+\s*초\s*(후)?\s*건너뛰기/.test(t)) return true;
      if (/건너뛰기/.test(t) && t.length <= 20) return true;
      return false;
    }

    function forceSkipAd() {
      // Soft skip only — no video.seek, no play/mute UI clicking.
      let hit = false;
      for (const el of document.querySelectorAll("button, [role='button']")) {
        if (!isSkipControl(el)) continue;
        try {
          if ("disabled" in el) el.disabled = false;
          el.removeAttribute("disabled");
          el.click();
          hit = true;
          api.bumpCount(1);
        } catch {}
      }
      return hit;
    }

    function hideAdLabels() {
      document.querySelectorAll("button, div, span").forEach((el) => {
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!t || t.length > 24) return;
        if (/^(AD\b|광고)(\s*\d+\/\d+)?$/i.test(t) && el.childElementCount <= 2) {
          api.hideEl(el, "chzzk:ad-label");
        }
      });
    }

    function sweep() {
      dismissAdblockPopup();
      forceSkipAd();
      api.hideMatches(document, SELECTORS, "chzzk-ad");
      hideAdLabels();
    }

    api.watchDom(sweep, 300);
    setInterval(() => {
      dismissAdblockPopup();
      forceSkipAd();
    }, 600);

    console.info("[Adblock MVP] CHZZK DOM hide ACTIVE v0.3.3 (soft)");
  })();
})();
