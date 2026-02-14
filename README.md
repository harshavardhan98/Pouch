# Pouch

A simple, privacy-focused Chrome extension for saving and organizing links. Like a kangaroo's pouch, it keeps your important links safe and close at hand.

![Pouch Logo](icons/icon-cropped.svg)

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

## How It Works

### Saving Links

1. Navigate to any webpage you want to save
2. Click the Pouch icon in your Chrome toolbar
3. Optionally add tags (press Enter after each tag)
4. Click "Save Link"

A delightful animation shows your link being saved into the kangaroo's pouch!

### Managing Links

Click "View all saved links" in the popup or navigate to the extension's links page to:

- **Search** - Use the search bar to find links by title, URL, or tag
- **Filter by Tag** - Click tags in the sidebar to filter your links
- **Sort Tags** - Sort sidebar tags alphabetically (A-Z) or by count
- **Delete Links** - Remove links with undo support (5 second window)

### Import & Export

- **Export**: Click "Export" to download all your links as a JSON file
- **Import JSON**: Import a previously exported JSON file
- **Import Pocket CSV**: Migrate from Pocket by importing your Pocket CSV export

## Project Structure

```
Pouch/
├── manifest.json          # Chrome extension manifest
├── background.js          # Service worker for link management
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── links/                 # Full links management page
│   ├── links.html
│   ├── links.css
│   ├── links.js
│   └── modules/           # Modular components
│       ├── utils.js
│       ├── csv-parser.js
│       ├── link-renderer.js
│       ├── tag-sidebar.js
│       └── toast.js
├── icons/                 # Extension icons
│   ├── icon.svg
│   ├── icon-cropped.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── tests/                 # Jest test suite
    └── links.test.js
```

## Development

### Running Tests

```bash
npm install
npm test
```

### Tech Stack

- Vanilla JavaScript (no frameworks)
- Chrome Extension Manifest V3
- Chrome Storage API for persistence
- Jest for testing

## Future Roadmap

Potential features for future releases:

- **Browser Sync** - Sync links across devices using Chrome's built-in sync storage
- **Keyboard Shortcuts** - Quick save with customizable hotkeys
- **Rich Previews** - Auto-fetch page descriptions and favicons
- **Collections** - Group links into named collections beyond tags
- **Dark Mode** - System-aware dark theme support
- **Bulk Operations** - Select and manage multiple links at once
- **Archive Mode** - Mark links as read/archived
- **Firefox Support** - Port to Firefox using WebExtensions API

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - feel free to use, modify, and distribute.

---

Made with care for people who value their privacy.
