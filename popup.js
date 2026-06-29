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

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeLoading(msg) {
  return el("div", "loading", msg);
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
      content.replaceChildren(makeLoading("Failed to detect IP. Check your connection."));
      return;
    }
  }

  const rowsEl = el("div", "rows");
  FIELDS
    .filter(f => data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== "")
    .forEach(f => {
      const row = el("div", "row");
      row.append(el("span", "label", f.label), el("span", "value", String(data[f.key])));
      rowsEl.appendChild(row);
    });

  const refreshBtn = el("button", "refresh-btn", "↻ Refresh");
  refreshBtn.id = "refresh";

  content.replaceChildren(
    el("div", "flag", data.flag || "🌐"),
    el("div", "country", data.country || "Unknown"),
    el("div", "divider"),
    rowsEl,
    refreshBtn
  );

  refreshBtn.addEventListener("click", async () => {
    content.replaceChildren(makeLoading("Refreshing…"));
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

  // Settings toggle button
  const arrow = el("span", "settings-arrow", "▶");
  arrow.id = "settings-arrow";
  const toggleBtn = el("button", "settings-toggle");
  toggleBtn.id = "settings-toggle";
  toggleBtn.append(el("span", null, "Settings"), arrow);

  // Refresh interval row
  const select = document.createElement("select");
  select.className = "settings-select";
  select.id = "interval-select";
  INTERVAL_OPTIONS.forEach(o => {
    const opt = el("option", null, o.label);
    opt.value = String(o.value);
    if (o.value === refreshInterval) opt.selected = true;
    select.appendChild(opt);
  });
  const intervalRow = el("div", "settings-row");
  intervalRow.append(el("span", "settings-label", "Refresh Interval"), select);

  // Theme toggle row
  const themeInput = document.createElement("input");
  themeInput.type = "checkbox";
  themeInput.id = "theme-toggle";
  themeInput.checked = isLight;
  const themeSwitch = el("label", "theme-switch");
  themeSwitch.append(themeInput, el("span", "theme-slider"));
  const themeRow = el("div", "settings-row");
  themeRow.append(el("span", "settings-label", "Light Mode"), themeSwitch);

  // Settings panel
  const panel = el("div", "settings-panel");
  panel.id = "settings-panel";
  panel.append(intervalRow, themeRow);

  section.replaceChildren(toggleBtn, panel);

  toggleBtn.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    arrow.textContent = open ? "▼" : "▶";
  });

  select.addEventListener("change", async (e) => {
    const intervalMs = parseInt(e.target.value, 10);
    await browser.storage.local.set({ refreshInterval: intervalMs });
    browser.runtime.sendMessage({ action: "setInterval", intervalMs });
  });

  themeInput.addEventListener("change", async (e) => {
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
