const defaults = { language: "en", theme: "pastel", accent: "#2e7d32", font: "system", arabicFont: "amiri", domains: [], webSettingsUrl: "" };
const themeColors = { pastel: "#2e7d32", light: "#52745a", dark: "#8db99b", emerald: "#059669", blue: "#2563a6", purple: "#7652a5" };
const controls = ["language", "theme", "accent", "font", "arabicFont"];

function save(values, done = () => {}) {
  chrome.storage.local.set(values, () => {
    if (chrome.runtime.lastError) {
      showStatus(translate("en", "error"));
      return;
    }
    done();
  });
}

function showStatus(text) {
  const status = document.querySelector("#status");
  status.textContent = text;
  setTimeout(() => { status.textContent = ""; }, 2500);
}

function renderDomains(domains) {
  const list = document.querySelector("#domains");
  list.replaceChildren();
  domains.forEach((domain) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = domain;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      const updated = domains.filter((value) => value !== domain);
      save({ domains: updated }, () => renderDomains(updated));
    });
    row.append(label, remove);
    list.append(row);
  });
}

function render(settings) {
  controls.forEach((key) => { document.querySelector(`#${key}`).value = settings[key]; });
  document.querySelector("#webSettingsUrl").value = settings.webSettingsUrl;
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.body.style.fontFamily = fontFamily(settings.font);
  document.documentElement.style.setProperty("--arabic-font", settings.arabicFont === "tajawal" ? "Tajawal" : "Amiri");
  document.documentElement.lang = settings.language;
  document.documentElement.dir = ["ar", "ur"].includes(settings.language) ? "rtl" : "ltr";
  document.querySelectorAll("[data-t]").forEach((node) => { node.textContent = translate(settings.language, node.dataset.t); });
  renderDomains(settings.domains);
}

function fontFamily(value) {
  return ({ tajawal: "Tajawal, sans-serif", inter: "Inter, sans-serif", roboto: "Roboto, sans-serif", outfit: "Outfit, sans-serif", serif: "Georgia, serif", sans: "sans-serif" })[value] ?? "system-ui, sans-serif";
}

chrome.storage.local.get(defaults, (settings) => {
  if (chrome.runtime.lastError) return showStatus(translate("en", "error"));
  render({ ...defaults, ...settings });
});

controls.forEach((key) => document.querySelector(`#${key}`).addEventListener("change", (event) => {
  const value = event.currentTarget.value;
  const update = key === "theme" && value !== "custom" ? { theme: value, accent: themeColors[value] } : { [key]: value };
  save(update, () => chrome.storage.local.get(defaults, render));
}));

document.querySelector("#accent").addEventListener("input", (event) => {
  const accent = event.currentTarget.value;
  document.documentElement.dataset.theme = "custom";
  document.documentElement.style.setProperty("--accent", accent);
  save({ theme: "custom", accent });
});

document.querySelector("#domain-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#domain");
  let domain;
  try { domain = new URL(`https://${input.value.trim()}`).hostname.toLowerCase(); } catch { return showStatus("Enter a valid domain name."); }
  if (!domain || domain === "") return;
  chrome.storage.local.get(defaults, (settings) => {
    if (chrome.runtime.lastError) return showStatus(translate("en", "error"));
    const domains = [...new Set([...settings.domains, domain])];
    save({ domains }, () => {
      renderDomains(domains);
      input.value = "";
      showStatus(translate(settings.language, "added"));
    });
  });
});

document.querySelector("#webSettingsUrl").addEventListener("change", (event) => {
  const input = event.currentTarget;
  let url = "";
  if (input.value.trim()) {
    try {
      const parsed = new URL(input.value.trim());
      if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error();
      url = parsed.href;
    } catch {
      input.setCustomValidity("Enter a valid HTTPS settings URL.");
      input.reportValidity();
      return;
    }
  }
  input.setCustomValidity("");
  save({ webSettingsUrl: url });
});