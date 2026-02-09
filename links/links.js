/**
 * Pouch Links Page - Main Controller
 * Manages the saved links view with search, filtering, and import/export
 */

(function () {
  "use strict";

  // ==========================================================================
  // DOM Elements
  // ==========================================================================

  const elements = {
    searchInput: document.getElementById("search-input"),
    activeTags: document.getElementById("active-tags"),
    linksContainer: document.getElementById("links-container"),
    emptyState: document.getElementById("empty-state"),
    exportBtn: document.getElementById("export-btn"),
    importInput: document.getElementById("import-input"),
    pocketImportInput: document.getElementById("pocket-import-input"),
    sidebar: document.getElementById("tag-sidebar"),
    sidebarContent: document.getElementById("sidebar-content"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
  };

  // ==========================================================================
  // State
  // ==========================================================================

  let allLinks = [];
  let filterTags = [];

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async function init() {
    allLinks = await chrome.runtime.sendMessage({ action: "getLinks" });

    // Initialize sidebar
    TagSidebar.init({
      container: elements.sidebarContent,
      onTagClick: handleSidebarTagClick,
      onClearFilters: clearAllFilters,
    });

    TagSidebar.setSortChangeCallback(() => {
      TagSidebar.render(allLinks, filterTags);
    });

    // Bind events
    bindEvents();

    // Initial render
    render();
  }

  // ==========================================================================
  // Event Binding
  // ==========================================================================

  function bindEvents() {
    // Search
    elements.searchInput.addEventListener("input", render);

    // Tag filtering from link cards
    elements.linksContainer.addEventListener("click", handleLinksContainerClick);

    // Remove active tag filter
    elements.activeTags.addEventListener("click", handleActiveTagsClick);

    // Sidebar toggle
    elements.sidebarToggle.addEventListener("click", toggleSidebar);

    // Export
    elements.exportBtn.addEventListener("click", handleExport);

    // JSON Import
    elements.importInput.addEventListener("change", handleJSONImport);

    // Pocket CSV Import
    elements.pocketImportInput.addEventListener("change", handlePocketImport);

    // Re-sync when storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  function render() {
    const filtered = getFilteredLinks();

    renderActiveTags();
    renderSidebar();

    if (allLinks.length === 0) {
      elements.linksContainer.innerHTML = "";
      elements.emptyState.classList.remove("hidden");
      return;
    }

    elements.emptyState.classList.add("hidden");

    if (filtered.length === 0) {
      elements.linksContainer.innerHTML = LinkRenderer.renderNoResults();
      return;
    }

    elements.linksContainer.innerHTML = LinkRenderer.renderCards(filtered);
  }

  function renderActiveTags() {
    elements.activeTags.innerHTML = LinkRenderer.renderActiveFilters(filterTags);
  }

  function renderSidebar() {
    TagSidebar.render(allLinks, filterTags);
  }

  // ==========================================================================
  // Filtering
  // ==========================================================================

  function getFilteredLinks() {
    const query = elements.searchInput.value.trim().toLowerCase();
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

    return filtered;
  }

  function addTagFilter(tag) {
    if (!filterTags.includes(tag)) {
      filterTags.push(tag);
      render();
    }
  }

  function removeTagFilter(tag) {
    filterTags = filterTags.filter((t) => t !== tag);
    render();
  }

  function clearAllFilters() {
    filterTags = [];
    elements.searchInput.value = "";
    render();
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  function handleLinksContainerClick(e) {
    if (e.target.classList.contains("tag")) {
      addTagFilter(e.target.dataset.tag);
      return;
    }

    if (e.target.classList.contains("delete-btn")) {
      deleteLink(e.target.dataset.id);
    }
  }

  function handleActiveTagsClick(e) {
    if (e.target.classList.contains("filter-tag")) {
      removeTagFilter(e.target.dataset.tag);
    }
  }

  function handleSidebarTagClick(tag) {
    if (filterTags.includes(tag)) {
      removeTagFilter(tag);
    } else {
      addTagFilter(tag);
    }
  }

  function toggleSidebar() {
    const sidebar = elements.sidebar;
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      sidebar.classList.toggle("open");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  }

  function handleStorageChange(changes) {
    if (changes.links) {
      allLinks = changes.links.newValue || [];
      render();
    }
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async function deleteLink(id) {
    await chrome.runtime.sendMessage({ action: "deleteLink", id });
    allLinks = allLinks.filter((l) => l.id !== id);
    render();
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  async function handleExport() {
    const freshLinks = await chrome.runtime.sendMessage({ action: "getLinks" });
    const data = JSON.stringify(freshLinks, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pouch-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // JSON Import
  // ==========================================================================

  async function handleJSONImport(e) {
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

    const added = importLinks(imported);
    await chrome.storage.local.set({ links: allLinks });
    render();
    alert(`Imported ${added} new link${added !== 1 ? "s" : ""}.`);
    elements.importInput.value = "";
  }

  // ==========================================================================
  // Pocket CSV Import
  // ==========================================================================

  async function handlePocketImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    let parsed;

    try {
      parsed = CSVParser.parsePocketCSV(text);
    } catch {
      alert("Failed to parse Pocket CSV file.");
      return;
    }

    if (parsed.length === 0) {
      alert("No links found in the CSV file.");
      return;
    }

    const added = importLinks(parsed);
    await chrome.storage.local.set({ links: allLinks });
    render();
    alert(`Imported ${added} new link${added !== 1 ? "s" : ""} from Pocket.`);
    elements.pocketImportInput.value = "";
  }

  // ==========================================================================
  // Import Helper
  // ==========================================================================

  function importLinks(items) {
    const existingUrls = new Set(allLinks.map((l) => l.url));
    let added = 0;

    for (const item of items) {
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

    return added;
  }

  // ==========================================================================
  // Start
  // ==========================================================================

  init();
})();
