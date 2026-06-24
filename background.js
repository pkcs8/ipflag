const DEFAULT_INTERVAL_MS = 60000;
let refreshTimer = null;

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
    browser.browserAction.setTitle({
      title: `${flag} ${countryName}\nIP: ${ip}`
    });

    const { status, ...ipData } = data;
    browser.storage.local.set({ ...ipData, flag });

  } catch (err) {
    console.error("IP Flag: failed to fetch IP info", err);
    browser.browserAction.setTitle({ title: "IP Flag: error fetching location" });
  }
}

function startTimer(intervalMs) {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(updateFlag, intervalMs);
}

async function init() {
  let { refreshInterval } = await browser.storage.local.get("refreshInterval");
  if (!refreshInterval) {
    refreshInterval = DEFAULT_INTERVAL_MS;
    browser.storage.local.set({ refreshInterval });
  }
  updateFlag();
  startTimer(refreshInterval);
}

init();

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "refresh") updateFlag();
  if (msg.action === "setInterval") startTimer(msg.intervalMs);
});
