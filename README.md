# Pouch

<p>
  <img src="icons/icon-cropped.svg" alt="Pouch Logo" width="48" align="left" style="margin-right: 12px;">
  <strong>A simple, privacy-focused Chrome extension for saving and organizing links.</strong><br>
  Like a kangaroo's pouch, it keeps your important links safe and close at hand.
</p>
<br clear="left">

[![Watch the demo](https://cdn.loom.com/sessions/thumbnails/fc2e73dae37b4f6a8e3668828bfc5154-with-play.gif)](https://www.loom.com/share/fc2e73dae37b4f6a8e3668828bfc5154)

## Features

- **Save Links Instantly** - Click the Pouch icon in your toolbar to save the current page
- **Tag Organization** - Add tags to categorize your links for easy filtering
- **Smart Search** - Search across titles, URLs, and tags
- **Tag Sidebar** - Filter links by tags with a collapsible sidebar showing tag counts
- **Import/Export** - Export your links as JSON and import them back anytime
- **Pocket Import** - Migrate from Pocket using CSV export
- **Undo Delete** - Accidentally deleted a link? Undo within 5 seconds
- **100% Local** - All data stays in your browser. No accounts, no servers, no tracking

## Privacy First

Pouch is designed with privacy as a core principle:

- **No external servers** - Your data never leaves your browser
- **No accounts required** - Start saving links immediately
- **No analytics or tracking** - We don't collect any data about your usage
- **Open source** - Inspect the code yourself

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The Pouch icon will appear in your toolbar

### Running Tests

```bash
npm install
npm test
```

## Future Roadmap

Potential features for future releases:
- **Browser Sync** - Sync links across devices using Chrome's built-in sync storage
- **Keyboard Shortcuts** - Quick save with customizable hotkeys
- **Rich Previews** - Auto-fetch page descriptions and favicons
- **Collections** - Group links into named collections beyond tags
- **Dark Mode** - System-aware dark theme support
- **Archive Mode** - Mark links as read/archived
- **Firefox Support** - Port to Firefox using WebExtensions API

## License

MIT License - feel free to use, modify, and distribute.

---
