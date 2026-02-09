/**
 * Tag Sidebar Component
 * Displays all available tags with counts and allows filtering
 */

const TagSidebar = {
  /**
   * Initialize the sidebar
   * @param {Object} options
   * @param {HTMLElement} options.container - Sidebar container element
   * @param {Function} options.onTagClick - Callback when tag is clicked
   * @param {Function} options.onClearFilters - Callback to clear all filters
   */
  init(options) {
    this.container = options.container;
    this.onTagClick = options.onTagClick;
    this.onClearFilters = options.onClearFilters;
    this.sortBy = "count"; // 'count' or 'alpha'

    this._bindEvents();
  },

  /**
   * Render the sidebar with tags
   * @param {Array} links - All links
   * @param {Array} activeFilters - Currently active tag filters
   */
  render(links, activeFilters = []) {
    const tagCounts = this._getTagCounts(links);
    const sortedTags = this._sortTags(tagCounts);

    this.container.innerHTML = this._buildHTML(sortedTags, activeFilters);
  },

  /**
   * Get tag counts from links
   * @private
   */
  _getTagCounts(links) {
    const counts = new Map();

    for (const link of links) {
      for (const tag of link.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    return counts;
  },

  /**
   * Sort tags based on current sort mode
   * @private
   */
  _sortTags(tagCounts) {
    const entries = Array.from(tagCounts.entries());

    if (this.sortBy === "alpha") {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
      // Sort by count (descending), then alphabetically
      entries.sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      });
    }

    return entries;
  },

  /**
   * Build the sidebar HTML
   * @private
   */
  _buildHTML(sortedTags, activeFilters) {
    if (sortedTags.length === 0) {
      return `
        <div class="sidebar-header">
          <h2>Tags</h2>
        </div>
        <div class="sidebar-empty">
          <p>No tags yet</p>
        </div>
      `;
    }

    const tagsHTML = sortedTags
      .map(([tag, count]) => {
        const isActive = activeFilters.includes(tag);
        const escapedTag = Utils.escapeHtml(tag);
        return `
          <button
            class="sidebar-tag ${isActive ? "active" : ""}"
            data-tag="${escapedTag}"
            title="${escapedTag}"
          >
            <span class="sidebar-tag-name">${escapedTag}</span>
            <span class="sidebar-tag-count">${count}</span>
          </button>
        `;
      })
      .join("");

    const clearButtonHTML =
      activeFilters.length > 0
        ? `<button class="sidebar-clear-btn" id="clear-filters">Clear filters</button>`
        : "";

    return `
      <div class="sidebar-header">
        <h2>Tags</h2>
        <div class="sidebar-sort">
          <button
            class="sort-btn ${this.sortBy === "count" ? "active" : ""}"
            data-sort="count"
            title="Sort by count"
          >#</button>
          <button
            class="sort-btn ${this.sortBy === "alpha" ? "active" : ""}"
            data-sort="alpha"
            title="Sort alphabetically"
          >A-Z</button>
        </div>
      </div>
      ${clearButtonHTML}
      <div class="sidebar-tags">
        ${tagsHTML}
      </div>
      <div class="sidebar-footer">
        <span>${sortedTags.length} tag${sortedTags.length !== 1 ? "s" : ""}</span>
      </div>
    `;
  },

  /**
   * Bind event listeners
   * @private
   */
  _bindEvents() {
    this.container.addEventListener("click", (e) => {
      // Tag click
      if (e.target.closest(".sidebar-tag")) {
        const btn = e.target.closest(".sidebar-tag");
        const tag = btn.dataset.tag;
        if (this.onTagClick) {
          this.onTagClick(tag);
        }
        return;
      }

      // Sort button click
      if (e.target.closest(".sort-btn")) {
        const btn = e.target.closest(".sort-btn");
        this.sortBy = btn.dataset.sort;
        // Re-render will be triggered by the parent
        if (this.onSortChange) {
          this.onSortChange(this.sortBy);
        }
        return;
      }

      // Clear filters click
      if (e.target.id === "clear-filters") {
        if (this.onClearFilters) {
          this.onClearFilters();
        }
      }
    });
  },

  /**
   * Set sort change callback
   * @param {Function} callback
   */
  setSortChangeCallback(callback) {
    this.onSortChange = callback;
  },
};

// Make available globally and export for testing
(function (root) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = TagSidebar;
  }
  if (typeof root !== "undefined") {
    root.TagSidebar = TagSidebar;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
