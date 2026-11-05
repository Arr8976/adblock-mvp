/* PAGE (MAIN) — CHZZK ad neuter v0.3.3
 * Strategy (crackle-style):
 *  1) Rewrite GFP schedule / SSP waterfall / seoraksan by RESPONSE SHAPE
 *  2) Uint8Array construct hook (catches decodes even if fetch was saved early)
 *  3) OPTIONS to nam.veta → 200 (anti-adblock / CORS)
 * Do NOT blindly short-circuit /gfp/v1 as waterfall — wrong mock type lets ads fall through.
 */
(() => {
  if (window.__adblockMvpChzzkInjected) return;
  window.__adblockMvpChzzkInjected = true;

  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8", { fatal: true });

  const hex = (n) => {
    const a = new Uint8Array(Math.ceil(n / 2));
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, n);
  };

  const mockSchedule = () => ({
    head: { version: "0.0.1", description: "GFP Video Ad Schedule" },
    requestId: `vas-${crypto.randomUUID()}`,
    videoAdScheduleId: "LIVE_CHZZK_NDP_SCH",
    adBreaks: [{ id: "", startDelay: 0, preFetch: 0, adUnitId: "", adSources: [] }],
  });

  const mockWaterfall = () => ({
    requestId: hex(32),
    head: { version: "0.0.1", description: "Naver SSP Waterfall List" },
    eventTracking: {
      ackImpressions: [{ url: "https://siape.veta.naver.com/openrtb/nbackimp?" }],
      activeViewImpressions: [{ url: "https://siape.veta.naver.com/openrtb/nbackimp?" }],
      clicks: [{ url: "https://siape.veta.naver.com/openrtb/nbackimp?" }],
      completions: [{ url: "https://siape.veta.naver.com/openrtb/nbackimp?" }],
      attached: [{ url: "https://siape.veta.naver.com/openrtb/nbackimp?" }],
      renderedImpressions: [{ url: "https://tivan.naver.com/sc2/11/" }],
      viewableImpressions: [{ url: "https://tivan.naver.com/sc2/12/" }],
      loadErrors: [{ url: "https://tivan.naver.com/sc2/91/" }],
      startErrors: [{ url: "https://tivan.naver.com/sc2/92/" }],
      lazyRenderMediaFailed: [{ url: "https://tivan.naver.com/sc2/93/" }],
      mute: [{ url: "https://tivan.naver.com/sc2/5/" }],
      close: [{ url: "https://tivan.naver.com/sc2/6/" }],
    },
    adUnit: "w_live_chzzk_naver_va",
    randomNumber: hex(2),
    adDivId: "live_player_layout",
    videoSkipMin: 5,
    videoSkipAfter: 5,
    ads: [],
  });

  const looksLikeSchedule = (t) =>
    typeof t === "string" && t.includes("GFP Video Ad Schedule") && t.includes("adBreaks");

  const looksLikeWaterfall = (t) =>
    typeof t === "string" && t.includes("Naver SSP Waterfall List") && /"ads"\s*:/.test(t);

  const patchSeoraksanObj = (j) => {
    const pad = j?.content?.playerAdDisplayResponse;
    if (pad && typeof pad === "object") {
      pad.preRoll = false;
      pad.midRoll = false;
      return true;
    }
    return false;
  };

  const rewriteText = (text) => {
    if (!text || typeof text !== "string") return null;
    if (looksLikeSchedule(text)) {
      console.info("[Adblock MVP] neuter GFP Video Ad Schedule");
      return JSON.stringify(mockSchedule());
    }
    if (looksLikeWaterfall(text)) {
      console.info("[Adblock MVP] neuter Naver SSP Waterfall");
      return JSON.stringify(mockWaterfall());
    }
    if (text.includes("playerAdDisplayResponse")) {
      try {
        const j = JSON.parse(text);
        if (patchSeoraksanObj(j)) {
          console.info("[Adblock MVP] seoraksan preRoll/midRoll=false");
          return JSON.stringify(j);
        }
      } catch {}
    }
    return null;
  };

  const urlStr = (input) => {
    try {
      if (typeof input === "string") return input;
      if (input && typeof input.url === "string") return input.url;
      return String(input || "");
    } catch {
      return "";
    }
  };

  const isVetaHost = (url) => /veta\.naver\.com/i.test(url || "");
  const isSeoraksan = (url) => /seoraksan/i.test(url || "");
  const shouldInspectUrl = (url) =>
    isVetaHost(url) || isSeoraksan(url) || /\/gfp\//i.test(url || "");

  // --- Uint8Array: rewrite JSON payloads as the player decodes them ---
  const NativeU8 = window.Uint8Array;
  const startsWithJsonObj = (view) => {
    try {
      const u8 =
        view instanceof ArrayBuffer
          ? new NativeU8(view)
          : view instanceof NativeU8
            ? view
            : new NativeU8(view.buffer, view.byteOffset, Math.min(4, view.byteLength));
      return u8.length >= 2 && u8[0] === 0x7b && u8[1] === 0x22; // {"
    } catch {
      return false;
    }
  };

  window.Uint8Array = new Proxy(NativeU8, {
    construct(target, args) {
      if (!args.length || typeof args[0] === "number" || !startsWithJsonObj(args[0])) {
        return Reflect.construct(target, args);
      }
      try {
        const built = Reflect.construct(target, args);
        const text = dec.decode(built);
        const next = rewriteText(text);
        if (next) {
          return Reflect.construct(target, [enc.encode(next)]);
        }
        return built;
      } catch {
        return Reflect.construct(target, args);
      }
    },
  });

  const jsonResponse = (obj, base) =>
    new Response(JSON.stringify(obj), {
      status: base?.status || 200,
      statusText: base?.statusText || "OK",
      headers: base?.headers || {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });

  // --- fetch ---
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function patchedFetch(input, init) {
    const url = urlStr(input);
    const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();

    if (method === "OPTIONS" && isVetaHost(url)) {
      console.info("[Adblock MVP] OPTIONS 200", url);
      return new Response(null, {
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "*",
          "access-control-max-age": "86400",
        },
      });
    }

    const res = await nativeFetch(input, init);

    if (!shouldInspectUrl(url)) return res;

    try {
      const text = await res.clone().text();
      const next = rewriteText(text);
      if (!next) return res;
      return new Response(next, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    } catch {
      return res;
    }
  };

  // --- XHR ---
  const XO = XMLHttpRequest.prototype.open;
  const XS = XMLHttpRequest.prototype.send;
  const rtDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__adblockMvpUrl = String(url);
    this.__adblockMvpMethod = String(method || "GET");
    return XO.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const url = this.__adblockMvpUrl || "";
    const method = (this.__adblockMvpMethod || "GET").toUpperCase();

    if (method === "OPTIONS" && isVetaHost(url)) {
      Object.defineProperty(this, "status", { configurable: true, get: () => 200 });
      Object.defineProperty(this, "statusText", { configurable: true, get: () => "OK" });
      Object.defineProperty(this, "readyState", { configurable: true, get: () => 4 });
      Object.defineProperty(this, "responseText", { configurable: true, get: () => "" });
      Object.defineProperty(this, "response", { configurable: true, get: () => "" });
      setTimeout(() => {
        try {
          this.onreadystatechange && this.onreadystatechange();
        } catch {}
        try {
          this.onload && this.onload();
        } catch {}
        try {
          this.dispatchEvent(new Event("readystatechange"));
          this.dispatchEvent(new Event("load"));
        } catch {}
      }, 0);
      console.info("[Adblock MVP] XHR OPTIONS 200", url);
      return;
    }

    if (shouldInspectUrl(url)) {
      this.addEventListener("readystatechange", function () {
        if (this.readyState !== 4) return;
        try {
          const raw = rtDesc?.get ? rtDesc.get.call(this) : "";
          const next = rewriteText(String(raw || ""));
          if (!next) return;
          Object.defineProperty(this, "responseText", { configurable: true, get: () => next });
          Object.defineProperty(this, "response", { configurable: true, get: () => next });
        } catch {}
      });
    }

    return XS.apply(this, args);
  };

  console.info("[Adblock MVP] CHZZK GFP/Veta spoof ACTIVE v0.3.3");
})();
