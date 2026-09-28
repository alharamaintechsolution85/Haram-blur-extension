# Haram Blur

Local-first dashboard and Manifest V3 browser extension starter.

## Dashboard

Install dependencies with `npm install` and start the app with `npm run dev`. The dashboard stores preferences, consent, and the Mehram list in browser local storage.

Copy `.env.example` to `.env.local` to enable Supabase email/password authentication. Set the project's Supabase URL and publishable key, plus `NEXT_PUBLIC_SITE_URL`; add `<site-url>/auth/callback` to Supabase's allowed redirect URLs. Workspace routes remain in local mode when Supabase credentials are absent.

Preferences are stored locally. On the deployed settings origin, configure the same HTTPS URL in the extension's options page to enable the origin-scoped dashboard/extension settings bridge. No Supabase preference table is assumed or provisioned.

Keep service-role keys, AI provider keys, and Redis tokens server-side; never use them in browser or extension code.

## Chrome extension

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the `extension` directory. The extension bundles MediaPipe and a local face detector model, then places blur overlays only over detected face regions in visible images and video frames. It leaves surrounding media and video playback unchanged; CSS background images are not processed. It does not infer gender. All preferences are stored with `chrome.storage.local`, and the detector makes no network requests.

## Current boundaries

Gender classification, mobile/Expo support, family synchronization, prayer-time scheduling, automated analytics, and AI/Redis integrations are not implemented yet. `app/api/README.md` and `mobile/README.md` mark their intended locations. Dashboard artwork is in `public/`.
