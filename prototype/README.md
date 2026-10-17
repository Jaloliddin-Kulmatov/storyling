# Prototype

The first single-file version of Storyling, kept for reference. `index.html` opens in any browser.

`src/build.py` re-records the seed audio with macOS voices (`say`) and rebuilds the page. The real apps now read
their content from `packages/content` and their audio from `apps/web/public/audio` and `apps/mobile/assets/audio`.
