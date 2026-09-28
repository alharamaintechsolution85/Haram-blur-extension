# Gaze Guard extension

Load this directory as an unpacked extension from `chrome://extensions` with Developer mode enabled.

The content script uses the bundled MediaPipe Face Detector and local model to place CSS backdrop-blur overlays only over detected face regions in visible images and video frames. Surrounding media remains clear, and video playback/audio are unchanged. CSS background images are not processed. Detection runs locally; no image data is uploaded.

The male/female profile preference is synchronized and triggers a rescan, but it does not classify a person's gender. All detected faces are treated alike. This avoids inferring a sensitive trait from appearance.

All settings are stored in `chrome.storage.local`. MediaPipe's JS, WASM, and model assets are bundled under `vendor/` and `models/`; runtime detection makes no network requests. The `_locales` catalogs provide Chrome-standard browser-locale metadata; the settings language selector uses the bundled UI dictionaries in `i18n.js`.