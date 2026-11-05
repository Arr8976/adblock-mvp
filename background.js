const DEFAULTS = { enabled: true, youtube: true, chzzk: true };

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (cur) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...cur });
  });
  chrome.storage.local.set({ sessionBlocks: 0 });
});

function isChzzkUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === "chzzk.naver.com" || u.hostname.endsWith(".chzzk.naver.com");
  } catch {
    return false;
  }
}

async function injectChzzkMain(tabId) {
  try {
    const { enabled = true, chzzk = true } = await chrome.storage.sync.get(DEFAULTS);
    if (!enabled || !chzzk) return;
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: "MAIN",
      files: ["content/chzzk-inject.js"],
      injectImmediately: true,
    });
  } catch (e) {
    // Tab may be restricted briefly during navigation.
    console.warn("[Adblock MVP] MAIN inject", e?.message || e);
  }
}

if (chrome.webNavigation?.onCommitted) {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;
    if (!isChzzkUrl(details.url)) return;
    injectChzzkMain(details.tabId);
  });
}

chrome.tabs?.onUpdated?.addListener((tabId, info, tab) => {
  if (info.status === "loading" && tab?.url && isChzzkUrl(tab.url)) {
    injectChzzkMain(tabId);
  }
});

if (chrome.declarativeNetRequest?.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(() => {
    chrome.storage.local.get({ sessionBlocks: 0 }, (v) => {
      chrome.storage.local.set({ sessionBlocks: (v.sessionBlocks || 0) + 1 });
    });
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "getStatus") {
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      chrome.storage.local.get({ sessionBlocks: 0 }, (local) => {
        sendResponse({ settings: { ...DEFAULTS, ...settings }, sessionBlocks: local.sessionBlocks || 0 });
      });
    });
    return true;
  }
  if (msg?.type === "setSettings") {
    chrome.storage.sync.set(msg.settings || {}, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === "resetCount") {
    chrome.storage.local.set({ sessionBlocks: 0 }, () => sendResponse({ ok: true }));
    return true;
  }
});
