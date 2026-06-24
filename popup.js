async function render() {
  const content = document.getElementById("content");

  let data = await browser.storage.local.get(["ip", "countryCode", "countryName", "flag"]);

  // If nothing cached yet, fetch live
  if (!data.ip) {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const json = await res.json();
      data = {
        ip: json.ip || "Unknown",
        countryCode: json.country_code || "",
        countryName: json.country_name || "Unknown",
        flag: getFlagEmoji(json.country_code || "")
      };
      await browser.storage.local.set(data);
    } catch {
      content.innerHTML = `<div class="loading">Failed to detect IP.<br>Check your connection.</div>`;
      return;
    }
  }

  content.innerHTML = `
    <div class="flag">${data.flag || "🌐"}</div>
    <div class="country">${data.countryName}</div>
    <div class="divider"></div>
    <div class="row">
      <span class="label">IP Address</span>
      <span class="value">${data.ip}</span>
    </div>
    <div class="row">
      <span class="label">Country Code</span>
      <span class="value">${data.countryCode}</span>
    </div>
    <button class="refresh-btn" id="refresh">↻ Refresh</button>
  `;

  document.getElementById("refresh").addEventListener("click", async () => {
    content.innerHTML = `<div class="loading">Refreshing…</div>`;
    await browser.storage.local.remove(["ip", "countryCode", "countryName", "flag"]);
    // Ask background to re-fetch
    await browser.runtime.sendMessage({ action: "refresh" });
    await render();
  });
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

render();
