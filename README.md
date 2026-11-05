# Adblock MVP (YouTube + CHZZK)

Minimal **Manifest V3** Edge/Chrome extension for personal experiments:

- **YouTube** — declarativeNetRequest + DOM hide / skip
- **CHZZK (치지직)** — GFP / Naver SSP compatible no-fill rewrite, seoraksan `preRoll`/`midRoll` off, soft skip + anti-adblock popup dismiss

Not affiliated with Malwarebytes, AdGuard, Google, or Naver.

**Current version:** see `manifest.json` (`0.3.3+`)

## Disclaimer

- **Personal / educational use only.** Blocking ads may violate YouTube or CHZZK (Naver) terms of service. Use at your own risk.
- No uptime or filter-quality guarantee. Site or ad-SDK changes can break behavior overnight.
- Do not expect commercial-grade coverage. This is a small MVP, not EasyList / uBlock.

## Install (unpacked)

### Edge
1. Open `edge://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder
4. Hard-refresh YouTube / CHZZK (`Ctrl+Shift+R`)

### Chrome
1. Open `chrome://extensions`
2. Same steps as above

## CHZZK notes

Works best when conflicting hard-blockers are understood:

- Other extensions (Chzzk utilities, Browser Guard, AdGuard) can also touch Veta/IMA.
- This MVP rewrites **response shapes** (`GFP Video Ad Schedule`, `Naver SSP Waterfall List`) and patches seoraksan ad display flags instead of blindly short-circuiting every `/gfp` URL.

Console success signals (examples):

```text
[Adblock MVP] CHZZK GFP/Veta spoof ACTIVE v0.3.3
[Adblock MVP] neuter GFP Video Ad Schedule
[Adblock MVP] neuter Naver SSP Waterfall
[Adblock MVP] seoraksan preRoll/midRoll=false
[Adblock MVP] CHZZK DOM hide ACTIVE v0.3.3 (soft)
```

## Layout

| Path | Role |
|------|------|
| `manifest.json` | MV3 manifest |
| `rules/ads.json` | Static DNR block rules |
| `content/chzzk-inject.js` | PAGE/MAIN world rewrite + OPTIONS helper |
| `content/chzzk.js` | DOM hide, soft skip, popup dismiss |
| `content/youtube.js` | YouTube DOM / skip |
| `background.js` | Settings + early MAIN inject |
| `popup/` | Per-site toggles |

## License

MIT — see [LICENSE](./LICENSE).

Response-format knowledge for CHZZK GFP / SSP empty fills was informed by public research (including approaches discussed around [crackle](https://github.com/FilteringDev/crackle)); this repository’s code is an independent implementation under MIT.
