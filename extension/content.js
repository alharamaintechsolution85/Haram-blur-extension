(() => {
  const initialUrl = new URL(location.href);
  const initialHost = initialUrl.hostname.toLowerCase();
  const excludedHost = initialHost === "gemini.google.com" || initialHost.endsWith(".gemini.google.com") || initialHost === "chatgpt.com" || initialHost.endsWith(".chatgpt.com");
  const excludedLocation = initialUrl.protocol === "chrome:" || (initialHost === "localhost" && initialUrl.port === "3000") || excludedHost;

  document.querySelectorAll(".hv-face-blur").forEach((overlay) => overlay.remove());
  document.querySelectorAll("[data-hv-blurred], [data-hv-preview]").forEach((element) => {
    delete element.dataset.hvBlurred;
    delete element.dataset.hvPreview;
    element.style.removeProperty("--hv-blur");
  });
  if (excludedLocation) return;

  const defaults = { enabled: true, blur: 25, domains: [], gender: "male", theme: "pastel", accent: "#2e7d32", font: "system", arabicFont: "amiri", webSettingsUrl: "" };
  const minimumMediaSize = 80;
  const targets = new Map();
  let settings = defaults;
  let observer;
  let detectorPromise;
  let imageDetector;
  let videoDetector;
  let lastVideoTimestamp = 0;
  let scanQueued = false;
  let positionQueued = false;

  function domainIsAllowed() {
    const host = location.hostname.toLowerCase();
    return settings.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  }

  function isExcludedLocation() {
    const url = new URL(location.href);
    const host = url.hostname.toLowerCase();
    return url.protocol === "chrome:" || (host === "localhost" && url.port === "3000") || host === "gemini.google.com" || host.endsWith(".gemini.google.com") || host === "chatgpt.com" || host.endsWith(".chatgpt.com");
  }

  function selectorsForPage() {
    const host = location.hostname.toLowerCase();
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
      return "#thumbnail img, ytd-rich-grid-media img, ytd-video-renderer img, ytd-compact-video-renderer img, ytd-thumbnail img, #thumbnail video, ytd-thumbnail video, video.html5-main-video, #player video";
    }
    if (host === "facebook.com" || host.endsWith(".facebook.com")) {
      return '[role="article"] img, [role="article"] video, [data-pagelet*="FeedUnit"] img, [data-pagelet*="FeedUnit"] video';
    }
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return "main article img, main article video, article img, article video";
    }
    if (/^www\.google\.[a-z.]+$/.test(host) || host.startsWith("google.")) {
      return new URL(location.href).searchParams.get("tbm") === "isch" ? "#islrg img, img[data-limg], [data-ri] img" : "main article img, main article video";
    }
    return "main img, main video, main canvas, article img, article video, article canvas";
  }

  function isMediaCandidate(element) {
    if (!(element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLCanvasElement)) return false;
    if (!element.matches(selectorsForPage())) return false;
    const rect = element.getBoundingClientRect();
    return rect.width >= minimumMediaSize && rect.height >= minimumMediaSize;
  }

  function removeOverlays(target) {
    const record = targets.get(target);
    if (!record) return;
    record.overlays.forEach((overlay) => overlay.remove());
    targets.delete(target);
  }

  function clearOverlays() {
    for (const target of targets.keys()) removeOverlays(target);
  }

  async function getDetectors() {
    if (!detectorPromise) {
      detectorPromise = (async () => {
        const vision = globalThis.Vision;
        if (!vision?.FilesetResolver || !vision?.FaceDetector) throw new Error("Local face detector bundle is unavailable.");
        const fileset = await vision.FilesetResolver.forVisionTasks(chrome.runtime.getURL("vendor/"));
        const modelAssetPath = chrome.runtime.getURL("models/blaze_face_short_range.tflite");
        imageDetector = await vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath },
          runningMode: "IMAGE",
          minDetectionConfidence: 0.55,
        });
        videoDetector = await vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.55,
        });
      })();
    }
    return detectorPromise;
  }

  function objectPosition(style, axis) {
    const parts = style.objectPosition.split(/\s+/);
    const value = parts[axis === "x" ? 0 : 1] ?? "50%";
    if (value.endsWith("%")) return Number.parseFloat(value) / 100;
    if (value === "left" || value === "top") return 0;
    if (value === "right" || value === "bottom") return 1;
    return 0.5;
  }

  function fittedBox(media, box) {
    const rect = media.getBoundingClientRect();
    const sourceWidth = media instanceof HTMLVideoElement ? media.videoWidth : media instanceof HTMLCanvasElement ? media.width : media.naturalWidth;
    const sourceHeight = media instanceof HTMLVideoElement ? media.videoHeight : media instanceof HTMLCanvasElement ? media.height : media.naturalHeight;
    if (!sourceWidth || !sourceHeight || !rect.width || !rect.height) return null;

    const style = getComputedStyle(media);
    const fit = style.objectFit || "fill";
    const scaleX = rect.width / sourceWidth;
    const scaleY = rect.height / sourceHeight;
    const scale = fit === "cover" ? Math.max(scaleX, scaleY) : fit === "contain" || fit === "scale-down" ? Math.min(scaleX, scaleY) : null;
    const renderedWidth = scale === null ? rect.width : sourceWidth * scale;
    const renderedHeight = scale === null ? rect.height : sourceHeight * scale;
    const offsetX = rect.left + (rect.width - renderedWidth) * objectPosition(style, "x");
    const offsetY = rect.top + (rect.height - renderedHeight) * objectPosition(style, "y");
    const factorX = scale ?? scaleX;
    const factorY = scale ?? scaleY;
    const padX = box.width * factorX * 0.12;
    const padY = box.height * factorY * 0.15;
    const left = Math.max(rect.left, offsetX + box.originX * factorX - padX);
    const top = Math.max(rect.top, offsetY + box.originY * factorY - padY);
    const right = Math.min(rect.right, offsetX + (box.originX + box.width) * factorX + padX);
    const bottom = Math.min(rect.bottom, offsetY + (box.originY + box.height) * factorY + padY);
    if (right <= left || bottom <= top) return null;
    return { left, top, width: right - left, height: bottom - top };
  }

  function positionOverlays(target, record) {
    if (!isMediaCandidate(target) || isExcludedLocation() || domainIsAllowed()) {
      removeOverlays(target);
      return;
    }
    record.overlays.forEach((overlay, index) => {
      const rect = fittedBox(target, record.boxes[index]);
      if (!rect) {
        overlay.hidden = true;
        return;
      }
      overlay.hidden = false;
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.setProperty("--hv-face-blur", `${settings.blur}px`);
    });
  }

  function updateOverlays(target, detections) {
    const boxes = detections.map((detection) => detection.boundingBox).filter(Boolean);
    if (!boxes.length || !settings.enabled || domainIsAllowed() || isExcludedLocation()) {
      removeOverlays(target);
      return;
    }
    const existing = targets.get(target);
    if (existing && existing.overlays.length === boxes.length) {
      existing.boxes = boxes;
      positionOverlays(target, existing);
      return;
    }
    removeOverlays(target);
    const overlays = boxes.map(() => {
      const overlay = document.createElement("div");
      overlay.className = "hv-face-blur";
      overlay.setAttribute("aria-hidden", "true");
      document.documentElement.append(overlay);
      return overlay;
    });
    const record = { boxes, overlays };
    targets.set(target, record);
    positionOverlays(target, record);
  }

  async function scanImage(image) {
    const canvas = image instanceof HTMLCanvasElement;
    const sourceWidth = canvas ? image.width : image.naturalWidth;
    const sourceHeight = canvas ? image.height : image.naturalHeight;
    if ((!canvas && !image.complete) || !sourceWidth || !sourceHeight || !isMediaCandidate(image) || !settings.enabled || domainIsAllowed() || isExcludedLocation()) {
      removeOverlays(image);
      return;
    }
    const rect = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden" || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) {
      removeOverlays(image);
      return;
    }
    try {
      await getDetectors();
      if (!image.isConnected || !settings.enabled || domainIsAllowed()) return removeOverlays(image);
      const result = imageDetector.detect(image);
      updateOverlays(image, result.detections ?? []);
    } catch {
      removeOverlays(image);
    }
  }

  const lastVideoMediaTimes = new WeakMap();

  function nextVideoTimestamp(mediaTime) {
    lastVideoTimestamp = Math.max(Math.round(mediaTime * 1000), lastVideoTimestamp + 1);
    return lastVideoTimestamp;
  }

  function scheduleVideo(video) {
    if (!video.isConnected || !video.videoWidth || !isMediaCandidate(video) || !settings.enabled || domainIsAllowed() || isExcludedLocation()) {
      removeOverlays(video);
      return;
    }
    if (typeof video.requestVideoFrameCallback === "function") {
      if (video.dataset.hvDetectionRunning) return;
      video.dataset.hvDetectionRunning = "true";
      const frame = async (_now, metadata) => {
        if (!video.isConnected || !isMediaCandidate(video) || !settings.enabled || domainIsAllowed() || isExcludedLocation()) {
          delete video.dataset.hvDetectionRunning;
          removeOverlays(video);
          return;
        }
        if (metadata.mediaTime - (lastVideoMediaTimes.get(video) ?? -1) >= 0.45) {
          lastVideoMediaTimes.set(video, metadata.mediaTime);
          try {
            await getDetectors();
            const timestamp = nextVideoTimestamp(metadata.mediaTime);
            const result = videoDetector.detectForVideo(video, timestamp);
            updateOverlays(video, result.detections ?? []);
          } catch {
            removeOverlays(video);
          }
        }
        video.requestVideoFrameCallback(frame);
      };
      video.requestVideoFrameCallback(frame);
      return;
    }
    if (video.dataset.hvDetectionRunning) return;
    video.dataset.hvDetectionRunning = "true";
    const run = async () => {
      if (!video.isConnected || !isMediaCandidate(video) || !settings.enabled || domainIsAllowed() || isExcludedLocation()) {
        delete video.dataset.hvDetectionRunning;
        removeOverlays(video);
        return;
      }
      if (video.videoWidth && !video.paused) {
        try {
          await getDetectors();
          const timestamp = nextVideoTimestamp(video.currentTime);
          const result = videoDetector.detectForVideo(video, timestamp);
          updateOverlays(video, result.detections ?? []);
        } catch {
          removeOverlays(video);
        }
      }
      setTimeout(run, 450);
    };
    setTimeout(run, 0);
  }

  function scanMedia(root) {
    if (!(root instanceof Element)) return;
    if (!settings.enabled || domainIsAllowed() || isExcludedLocation()) {
      for (const target of targets.keys()) removeOverlays(target);
      return;
    }
    const media = [];
    const selector = selectorsForPage();
    if (root.matches(selector)) media.push(root);
    media.push(...root.querySelectorAll(selector));
    for (const element of media) {
      if (!isMediaCandidate(element)) {
        removeOverlays(element);
      } else if (element instanceof HTMLImageElement) {
        scanImage(element);
      } else if (element instanceof HTMLVideoElement) {
        scheduleVideo(element);
      } else if (element instanceof HTMLCanvasElement) {
        scanImage(element);
      }
    }
    for (const target of targets.keys()) {
      if ((root === document.documentElement || root === target || root.contains(target)) && !isMediaCandidate(target)) removeOverlays(target);
    }
  }

  const scanRoots = new Set();

  function scheduleScan(root = document.documentElement) {
    scanRoots.add(root);
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      const roots = [...scanRoots];
      scanRoots.clear();
      roots.forEach(scanMedia);
    });
  }

  function schedulePosition() {
    if (positionQueued) return;
    positionQueued = true;
    requestAnimationFrame(() => {
      positionQueued = false;
      for (const [target, record] of targets) {
        if (!target.isConnected) removeOverlays(target);
        else positionOverlays(target, record);
      }
    });
  }

  function observe() {
    observer?.disconnect();
    if (!settings.enabled || domainIsAllowed() || isExcludedLocation()) {
      clearOverlays();
      return;
    }
    scheduleScan();
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (isExcludedLocation()) {
          observer.disconnect();
          clearOverlays();
          return;
        }
        if (record.target instanceof Element && record.target.classList.contains("hv-face-blur")) continue;
        if (record.type === "attributes" && record.target instanceof Element) {
          if (record.target instanceof HTMLImageElement || record.target instanceof HTMLCanvasElement) scanImage(record.target);
          else if (record.target instanceof HTMLVideoElement) scheduleVideo(record.target);
          else scheduleScan(record.target);
        }
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element) || node.classList.contains("hv-face-blur")) return;
          scheduleScan(node);
        });
        record.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          for (const target of targets.keys()) {
            if (target === node || node.contains(target)) removeOverlays(target);
          }
        });
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "style", "class", "srcset", "width", "height"],
    });
  }

  function notifyDashboard() {
    const source = settings.webSettingsUrl;
    if (!source) return;
    try { if (new URL(source).origin !== location.origin) return; } catch { return; }
    window.postMessage({
      source: "halal-vision-extension",
      type: "SETTINGS_UPDATED",
      preferences: {
        enabled: settings.enabled,
        blur: settings.blur,
        domains: settings.domains,
        gender: settings.gender,
        theme: settings.theme,
        accent: settings.accent,
        font: settings.font,
        arabicFont: settings.arabicFont,
      },
    }, location.origin);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.source !== "haram-blur-dashboard" || event.data?.type !== "SETTINGS_SYNC") return;
    let allowedOrigin;
    try { allowedOrigin = new URL(settings.webSettingsUrl).origin; } catch { return; }
    if (event.origin !== allowedOrigin) return;

    const value = event.data.preferences;
    if (!value || typeof value !== "object") return;
    const updates = {};
    if (typeof value.enabled === "boolean") updates.enabled = value.enabled;
    if (Number.isFinite(value.blur)) updates.blur = Math.max(0, Math.min(50, Math.round(value.blur)));
    if (value.gender === "male" || value.gender === "female") updates.gender = value.gender;
    if (["pastel", "light", "dark", "emerald", "blue", "purple", "custom"].includes(value.theme)) updates.theme = value.theme;
    if (typeof value.accent === "string" && /^#[0-9a-f]{6}$/i.test(value.accent)) updates.accent = value.accent;
    if (["system", "inter", "outfit", "roboto"].includes(value.font)) updates.font = value.font;
    if (["amiri", "tajawal"].includes(value.arabicFont)) updates.arabicFont = value.arabicFont;
    if (Array.isArray(value.domains)) updates.domains = value.domains.filter((domain) => typeof domain === "string" && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/i.test(domain)).slice(0, 100);

    chrome.storage.local.set(updates, () => {
      if (chrome.runtime.lastError) return;
      settings = { ...settings, ...updates };
      observe();
    });
  });

  document.addEventListener("scroll", () => {
    schedulePosition();
    scheduleScan();
  }, true);
  window.addEventListener("resize", () => {
    schedulePosition();
    scheduleScan();
  });
  window.addEventListener("orientationchange", schedulePosition);
  document.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) scanImage(event.target);
  }, true);
  for (const eventName of ["loadedmetadata", "loadeddata", "play"]) {
    document.addEventListener(eventName, (event) => {
      if (event.target instanceof HTMLVideoElement) scheduleVideo(event.target);
    }, true);
  }

  chrome.storage.local.get(defaults, (saved) => {
    if (chrome.runtime.lastError) return;
    settings = { ...defaults, ...saved };
    observe();
    notifyDashboard();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const [key, value] of Object.entries(changes)) settings[key] = value.newValue;
    observe();
    notifyDashboard();
  });
})();