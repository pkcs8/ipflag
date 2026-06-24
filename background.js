// Country code to flag emoji helper
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Draw flag emoji to an offscreen canvas and return imageData
function renderFlagToImageData(flagEmoji, size = 32) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.clearRect(0, 0, size, size);

  // Draw emoji
  ctx.font = `${size - 4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(flagEmoji, size / 2, size / 2 + 1);

  return ctx.getImageData(0, 0, size, size);
}

async function updateFlag() {
  try {
    // Use ipapi.co — free, no key needed
    const response = await fetch("http://ip-api.com/json/");
    const data = await response.json();

    const countryCode = data.countryCode || "";
    const countryName = data.country || "Unknown";
    const ip = data.query || "Unknown";
    const flag = getFlagEmoji(countryCode);

    // Render flag emoji as icon
    const imageData = renderFlagToImageData(flag, 32);
    browser.browserAction.setIcon({ imageData: { 32: imageData } });
    browser.browserAction.setTitle({
      title: `${flag} ${countryName}\nIP: ${ip}`
    });

    // Store for popup
    browser.storage.local.set({ ip, countryCode, countryName, flag });

  } catch (err) {
    console.error("IP Flag: failed to fetch IP info", err);
    browser.browserAction.setTitle({ title: "IP Flag: error fetching location" });
  }
}

// Run on startup and when browser wakes
updateFlag();
browser.runtime.onStartup.addListener(updateFlag);

// Handle refresh from popup
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "refresh") updateFlag();
});
