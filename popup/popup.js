const $ = (id) => document.getElementById(id);

function load() {
  chrome.runtime.sendMessage({ type: "getStatus" }, (res) => {
    if (!res) return;
    const s = res.settings || {};
    $("enabled").checked = !!s.enabled;
    $("youtube").checked = !!s.youtube;
    $("chzzk").checked = !!s.chzzk;
    $("count").textContent = String(res.sessionBlocks || 0);
  });
}

function save() {
  chrome.runtime.sendMessage({
    type: "setSettings",
    settings: {
      enabled: $("enabled").checked,
      youtube: $("youtube").checked,
      chzzk: $("chzzk").checked,
    },
  });
}

["enabled", "youtube", "chzzk"].forEach((id) => {
  $(id).addEventListener("change", save);
});

$("reset").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "resetCount" }, load);
});

load();
