const searchInput = document.getElementById("search-input");
const activeTags = document.getElementById("active-tags");
const linksContainer = document.getElementById("links-container");
const emptyState = document.getElementById("empty-state");
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");
const pocketImportInput = document.getElementById("pocket-import-input");

let allLinks = [];
let filterTags = [];

async function init() {
  allLinks = await chrome.runtime.sendMessage({ action: "getLinks" });
  render();
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = allLinks;

  if (query) {
    filtered = filtered.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.url.toLowerCase().includes(query) ||
        l.tags.some((t) => t.includes(query))
    );
  }

  if (filterTags.length > 0) {
    filtered = filtered.filter((l) =>
      filterTags.every((t) => l.tags.includes(t))
    );
  }

  renderActiveTags();

  if (allLinks.length === 0) {
    linksContainer.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  if (filtered.length === 0) {
    linksContainer.innerHTML =
      '<p style="text-align:center;color:#6b7280;padding:40px 0;">No links match your search.</p>';
    return;
  }

  linksContainer.innerHTML = filtered.map(linkCardHTML).join("");
}

function linkCardHTML(link) {
  const date = new Date(link.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const tagsHTML = link.tags
    .map(
      (t) =>
        `<button class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
    )
    .join("");

  return `
    <div class="link-card" data-id="${link.id}">
      <div class="link-card-header">
        <div class="link-info">
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="link-title">${escapeHtml(link.title)}</a>
          <p class="link-url">${escapeHtml(link.url)}</p>
          <p class="link-date">${date}</p>
        </div>
        <div class="link-actions">
          <button class="btn btn-danger delete-btn" data-id="${link.id}" title="Delete">&#x2715;</button>
        </div>
      </div>
      ${tagsHTML ? `<div class="link-tags">${tagsHTML}</div>` : ""}
    </div>
  `;
}

function renderActiveTags() {
  activeTags.innerHTML = filterTags
    .map(
      (t) =>
        `<button class="filter-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)} &times;</button>`
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Search
searchInput.addEventListener("input", () => render());

// Tag filtering from link cards
linksContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("tag")) {
    const tag = e.target.dataset.tag;
    if (!filterTags.includes(tag)) {
      filterTags.push(tag);
      render();
    }
    return;
  }

  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    deleteLink(id);
  }
});

// Remove tag filter
activeTags.addEventListener("click", (e) => {
  if (e.target.classList.contains("filter-tag")) {
    const tag = e.target.dataset.tag;
    filterTags = filterTags.filter((t) => t !== tag);
    render();
  }
});

async function deleteLink(id) {
  await chrome.runtime.sendMessage({ action: "deleteLink", id });
  allLinks = allLinks.filter((l) => l.id !== id);
  render();
}

// Export — always re-fetch from storage to get the latest data
exportBtn.addEventListener("click", async () => {
  const freshLinks = await chrome.runtime.sendMessage({ action: "getLinks" });
  const data = JSON.stringify(freshLinks, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pouch-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Import
importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  let imported;
  try {
    imported = JSON.parse(text);
  } catch {
    alert("Invalid JSON file.");
    return;
  }

  if (!Array.isArray(imported)) {
    alert("Invalid format. Expected an array of links.");
    return;
  }

  // Validate and merge
  const existingUrls = new Set(allLinks.map((l) => l.url));
  let added = 0;

  for (const item of imported) {
    if (!item.url || existingUrls.has(item.url)) continue;

    allLinks.unshift({
      id: item.id || crypto.randomUUID(),
      url: item.url,
      title: item.title || item.url,
      tags: Array.isArray(item.tags) ? item.tags : [],
      savedAt: item.savedAt || new Date().toISOString(),
    });
    existingUrls.add(item.url);
    added++;
  }

  await chrome.storage.local.set({ links: allLinks });
  render();
  alert(`Imported ${added} new link${added !== 1 ? "s" : ""}.`);
  importInput.value = "";
});

// Parse Pocket CSV format
function parsePocketCSV(csvText) {
  const lines = [];
  let current = "";
  let inQuotes = false;

  // Handle quoted fields that may contain newlines
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "\n" && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  // Skip header row
  if (lines.length === 0) return [];
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const fields = [];
    let field = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        fields.push(field);
        field = "";
      } else {
        field += char;
      }
    }
    fields.push(field);

    // Pocket CSV: title, url, time_added, tags, status
    const [title, url, timeAdded, tags] = fields;
    return {
      title: title || url,
      url: url,
      savedAt: timeAdded
        ? new Date(parseInt(timeAdded, 10) * 1000).toISOString()
        : new Date().toISOString(),
      tags: tags ? tags.split("|").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
    };
  });
}

// Import from Pocket CSV
pocketImportInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  let parsed;
  try {
    parsed = parsePocketCSV(text);
  } catch {
    alert("Failed to parse Pocket CSV file.");
    return;
  }

  if (parsed.length === 0) {
    alert("No links found in the CSV file.");
    return;
  }

  // Validate and merge
  const existingUrls = new Set(allLinks.map((l) => l.url));
  let added = 0;

  for (const item of parsed) {
    if (!item.url || existingUrls.has(item.url)) continue;

    allLinks.unshift({
      id: crypto.randomUUID(),
      url: item.url,
      title: item.title || item.url,
      tags: item.tags,
      savedAt: item.savedAt,
    });
    existingUrls.add(item.url);
    added++;
  }

  await chrome.storage.local.set({ links: allLinks });
  render();
  alert(`Imported ${added} new link${added !== 1 ? "s" : ""} from Pocket.`);
  pocketImportInput.value = "";
});

// Re-sync when storage changes (e.g. tags updated via popup in another tab)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.links) {
    allLinks = changes.links.newValue || [];
    render();
  }
});

init();
