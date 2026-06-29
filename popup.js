const FIELDS = [
  { key: "query",       label: "IP" },
  { key: "city",        label: "City" },
  { key: "regionName",  label: "Region" },
  { key: "region",      label: "Region Code" },
  { key: "zip",         label: "ZIP" },
  { key: "country",     label: "Country" },
  { key: "countryCode", label: "Country Code" },
  { key: "lat",         label: "Latitude" },
  { key: "lon",         label: "Longitude" },
  { key: "timezone",    label: "Timezone" },
  { key: "isp",         label: "ISP" },
  { key: "org",         label: "Organization" },
  { key: "as",          label: "AS" },
];

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
}

async function render() {
  const content = document.getElementById("content");

  let data = await browser.storage.local.get(null);

  if (!data.query) {
    try {
      const res = await fetch("http://ip-api.com/json/");
      const json = await res.json();
      const { status, ...ipData } = json;
      data = { ...ipData, flag: getFlagEmoji(ipData.countryCode || "") };
      await browser.storage.local.set(data);
    } catch {
      content.innerHTML = `<div class="loading">Failed to detect IP.<br>Check your connection.</div>`;
      return;
    }
  }

  const rows = FIELDS
    .filter(f => data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== "")
    .map(f => `
      <div class="row">
        <span class="label">${f.label}</span>
        <span class="value">${data[f.key]}</span>
      </div>
    `).join("");

  content.innerHTML = `
    <div class="flag">${data.flag || "🌐"}</div>
    <div class="country">${data.country || "Unknown"}</div>
    <div class="divider"></div>
    <div class="rows">${rows}</div>
    <button class="refresh-btn" id="refresh">↻ Refresh</button>
  `;

  document.getElementById("refresh").addEventListener("click", async () => {
    content.innerHTML = `<div class="loading">Refreshing…</div>`;
    await browser.storage.local.clear();
    await browser.runtime.sendMessage({ action: "refresh" });
    await render();
  });
}

const INTERVAL_OPTIONS = [
  { label: "1 minute",   value: 60000 },
  { label: "10 minutes", value: 600000 },
  { label: "1 hour",     value: 3600000 },
  { label: "1 day",      value: 86400000 },
];

async function renderSettings() {
  const section = document.getElementById("settings-section");
  const { refreshInterval, theme } = await browser.storage.local.get(["refreshInterval", "theme"]);
  const isLight = (theme || "light") === "light";

  section.innerHTML = `
    <button class="settings-toggle" id="settings-toggle">
      <span>Settings</span>
      <span class="settings-arrow" id="settings-arrow">▶</span>
    </button>
    <div class="settings-panel" id="settings-panel">
      <div class="settings-row">
        <span class="settings-label">Refresh Interval</span>
        <select class="settings-select" id="interval-select">
          ${INTERVAL_OPTIONS.map(o =>
            `<option value="${o.value}"${o.value === refreshInterval ? " selected" : ""}>${o.label}</option>`
          ).join("")}
        </select>
      </div>
      <div class="settings-row">
        <span class="settings-label">Light Mode</span>
        <label class="theme-switch">
          <input type="checkbox" id="theme-toggle"${isLight ? " checked" : ""}>
          <span class="theme-slider"></span>
        </label>
      </div>
    </div>
  `;

  const toggle = document.getElementById("settings-toggle");
  const panel  = document.getElementById("settings-panel");
  const arrow  = document.getElementById("settings-arrow");

  toggle.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    arrow.textContent = open ? "▼" : "▶";
  });

  document.getElementById("interval-select").addEventListener("change", async (e) => {
    const intervalMs = parseInt(e.target.value, 10);
    await browser.storage.local.set({ refreshInterval: intervalMs });
    browser.runtime.sendMessage({ action: "setInterval", intervalMs });
  });

  document.getElementById("theme-toggle").addEventListener("change", async (e) => {
    const newTheme = e.target.checked ? "light" : "dark";
    await browser.storage.local.set({ theme: newTheme });
    applyTheme(newTheme);
  });
}

async function init() {
  const { theme } = await browser.storage.local.get("theme");
  applyTheme(theme || "light");
  render();
  renderSettings();
}

init();

// Re-render if background refreshes while the popup is open
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.query) {
    render();
  }
});
