const defaults = { enabled: true, blur: 25, domains: [], gender: "male", language: "en", accent: "#2e7d32", theme: "pastel", webSettingsUrl: "" };
const enabledButton = document.querySelector("#enabled");
const blurSlider = document.querySelector("#blur");
const blurValue = document.querySelector("#blur-value");

function read(callback) {
  chrome.storage.local.get(defaults, (settings) => {
    if (chrome.runtime.lastError) return;
    callback({ ...defaults, ...settings });
  });
}

function write(values) {
  chrome.storage.local.set(values, () => {
    if (chrome.runtime.lastError) console.warn(translate("en", "error"));
  });
}

function render(settings) {
  enabledButton.setAttribute("aria-checked", String(settings.enabled));
  blurSlider.value = String(settings.blur);
  blurValue.value = `${settings.blur}px`;
  document.querySelector("#gender").value = settings.gender;
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.documentElement.dir = ["ar", "ur"].includes(settings.language) ? "rtl" : "ltr";
  document.body.style.fontFamily = ({ tajawal: "Tajawal, sans-serif", inter: "Inter, sans-serif", roboto: "Roboto, sans-serif", outfit: "Outfit, sans-serif", serif: "Georgia, serif", sans: "sans-serif" })[settings.font] ?? "system-ui, sans-serif";
  document.documentElement.style.setProperty("--arabic-font", settings.arabicFont === "tajawal" ? "Tajawal" : "Amiri");
  document.querySelectorAll("[data-t]").forEach((node) => {
    node.textContent = translate(settings.language, node.dataset.t);
  });
  document.documentElement.lang = settings.language;
  const themes = { pastel: "Pastel green", light: "Soft light", dark: "Deep slate", emerald: "Emerald", blue: "Deep blue", purple: "Purple", custom: "Custom" };
  document.querySelector("#theme-name").textContent = themes[settings.theme] ?? themes.pastel;
  const settingsButton = document.querySelector("#open-web-settings");
  settingsButton.querySelector("span:first-child").textContent = validSettingsUrl(settings.webSettingsUrl) ? "Open web settings" : "Set web settings URL";
  settingsButton.title = settings.webSettingsUrl || "Set your deployed settings URL in extension settings first";
}

function validSettingsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch { return false; }
}

read(render);

enabledButton.addEventListener("click", () => read((settings) => {
  write({ enabled: !settings.enabled });
  render({ ...settings, enabled: !settings.enabled });
}));

blurSlider.addEventListener("input", () => {
  const blur = Number(blurSlider.value);
  blurValue.value = `${blur}px`;
  write({ blur });
});

document.querySelector("#gender").addEventListener("change", (event) => write({ gender: event.currentTarget.value }));

document.querySelector("#trust-site").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (chrome.runtime.lastError || !tab?.url) return;
    let hostname;
    try { hostname = new URL(tab.url).hostname.toLowerCase(); } catch { return; }
    if (!hostname) return;
    read((settings) => {
      const domains = settings.domains.includes(hostname)
        ? settings.domains.filter((domain) => domain !== hostname)
        : [...settings.domains, hostname];
      write({ domains });
      document.querySelector("#trust-site span:last-child").textContent = translate(settings.language, settings.domains.includes(hostname) ? "removed" : "added");
    });
  });
});

document.querySelector("#open-options").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelector("#open-web-settings").addEventListener("click", () => read((settings) => {
  if (validSettingsUrl(settings.webSettingsUrl)) chrome.tabs.create({ url: settings.webSettingsUrl });
  else chrome.runtime.openOptionsPage();
}));