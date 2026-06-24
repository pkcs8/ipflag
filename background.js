const DEFAULT_INTERVAL_MS = 60000;

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function renderFlagToImageData(flagEmoji, size = 32) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${size - 4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(flagEmoji, size / 2, size / 2 + 1);
  return ctx.getImageData(0, 0, size, size);
}

async function updateFlag() {
  try {
    const response = await fetch("http://ip-api.com/json/");
    const data = await response.json();

    const countryCode = data.countryCode || "";
    const countryName = data.country || "Unknown";
    const ip = data.query || "Unknown";
    const flag = getFlagEmoji(countryCode);

    const imageData = renderFlagToImageData(flag, 32);
    browser.browserAction.setIcon({ imageData: { 32: imageData } });
    browser.browserAction.setTitle({ title: `${flag} ${countryName}\nIP: ${ip}` });

    const { status, ...ipData } = data;
    browser.storage.local.set({ ...ipData, flag });

  } catch (err) {
    console.error("IP Flag: failed to fetch IP info", err);
    browser.browserAction.setTitle({ title: "IP Flag: error fetching location" });
  }
}

function scheduleAlarm(intervalMs) {
  browser.alarms.create("ipRefresh", { periodInMinutes: intervalMs / 60000 });
}

// On install/update: set default interval if unset, fetch immediately, create alarm
browser.runtime.onInstalled.addListener(async () => {
  let { refreshInterval } = await browser.storage.local.get("refreshInterval");
  if (!refreshInterval) {
    refreshInterval = DEFAULT_INTERVAL_MS;
    browser.storage.local.set({ refreshInterval });
  }
  updateFlag();
  scheduleAlarm(refreshInterval);
});

// On browser startup: fetch immediately (alarm persists across restarts)
browser.runtime.onStartup.addListener(updateFlag);

// Periodic refresh via alarm
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "ipRefresh") updateFlag();
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "refresh") updateFlag();
  if (msg.action === "setInterval") scheduleAlarm(msg.intervalMs);
});
