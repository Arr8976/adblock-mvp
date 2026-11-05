(async () => {
  const api = window.__adblockMvp;
  if (!api) return;

  const settings = await api.getSettings();
  if (!settings.enabled || !settings.youtube) return;

  const SELECTORS = [
    ".video-ads",
    ".ytp-ad-module",
    ".ytp-ad-player-overlay",
    ".ytp-ad-overlay-container",
    ".ytp-ad-image-overlay",
    ".ytp-ad-text-overlay",
    ".ytp-ad-progress",
    ".ytp-ad-progress-list",
    "ytd-ad-slot-renderer",
    "ytd-banner-promo-renderer",
    "ytd-player-legacy-desktop-watch-ads-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-action-companion-ad-renderer",
    "ytd-display-ad-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-statement-banner-renderer",
    "#player-ads",
    "#masthead-ad",
    "#panels ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-ads']",
  ];

  const SKIP = [
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button",
    "button.ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button-container button",
  ];

  function sweep() {
    api.hideMatches(document, SELECTORS, "youtube-ad");
    // If an ad is playing, try skip / nudge playback forward when possible.
    const adShowing =
      document.querySelector(".ad-showing") ||
      document.querySelector(".ytp-ad-player-overlay") ||
      document.querySelector(".video-ads .ytp-ad-module");
    if (adShowing) {
      api.clickIfPresent(SKIP);
      const v = document.querySelector("video.html5-main-video");
      if (v && Number.isFinite(v.duration) && v.duration > 0 && v.currentTime < v.duration - 0.3) {
        try {
          v.currentTime = Math.max(v.currentTime, v.duration - 0.2);
          api.bumpCount(1);
        } catch (_) {}
      }
    }
  }

  api.watchDom(sweep, 600);
})();
