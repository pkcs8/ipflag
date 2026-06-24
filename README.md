# IP Flag

A Firefox extension that shows your current IP address and country flag in the toolbar.

## Features

- Displays your country's flag emoji as the browser toolbar icon
- Popup shows your public IP address, country name, and country code
- Refreshes automatically on browser startup
- Manual refresh button in the popup

## Installation

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** → **Load Temporary Add-on**
3. Select the `manifest.json` file from this directory

## How it works

The background script fetches your IP geolocation data on startup, renders the country flag emoji as a toolbar icon, and caches the result in local storage. The popup reads from cache and falls back to a live fetch if needed.

## Permissions

- `activeTab` — required by the WebExtension API for browser actions
- `storage` — caches IP/country data between popup opens

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV2) |
| `background.js` | Fetches IP data, updates toolbar icon |
| `popup.html` / `popup.js` | Popup UI |
| `icons/` | Placeholder toolbar icon |
