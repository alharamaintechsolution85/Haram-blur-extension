const defaults = {
  enabled: true,
  blur: 25,
  domains: [],
  gender: "male",
  language: "en",
  theme: "pastel",
  accent: "#2e7d32",
  font: "system",
  arabicFont: "amiri",
  webSettingsUrl: "",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(defaults, (saved) => {
    if (chrome.runtime.lastError) return;
    chrome.storage.local.set({ ...defaults, ...saved });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type !== "GET_SETTINGS") return;
  chrome.storage.local.get(defaults, (settings) => {
    if (chrome.runtime.lastError) {
      respond({ error: chrome.runtime.lastError.message });
      return;
    }
    respond(settings);
  });
  return true;
});