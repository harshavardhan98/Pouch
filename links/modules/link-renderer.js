/**
 * Link Card Renderer
 * Handles rendering of link cards in the main content area
 */

const LinkRenderer = {
  /**
   * Render a single link card
   * @param {Object} link - Link object
   * @returns {string} HTML string
   */
  renderCard(link) {
    const date = Utils.formatDate(link.savedAt);
    const tagsHTML = this._renderTags(link.tags);

    return `
      <div class="link-card" data-id="${link.id}">
        <div class="link-card-header">
          <div class="link-info">
            <a href="${Utils.escapeHtml(link.url)}" target="_blank" rel="noopener" class="link-title">
              ${Utils.escapeHtml(link.title)}
            </a>
            <p class="link-url">${Utils.escapeHtml(link.url)}</p>
            <p class="link-date">${date}</p>
          </div>
          <div class="link-actions">
            <button class="btn btn-danger delete-btn" data-id="${link.id}" title="Delete">&#x2715;</button>
          </div>
        </div>
        ${tagsHTML ? `<div class="link-tags">${tagsHTML}</div>` : ""}
      </div>
    `;
  },

  /**
   * Render multiple link cards
   * @param {Array} links - Array of link objects
   * @returns {string} HTML string
   */
  renderCards(links) {
    return links.map((link) => this.renderCard(link)).join("");
  },

  /**
   * Render tags for a link
   * @private
   */
  _renderTags(tags) {
    if (!tags || tags.length === 0) return "";

    return tags
      .map(
        (t) =>
          `<button class="tag" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</button>`
      )
      .join("");
  },

  /**
   * Render empty state
   * @returns {string} HTML string
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <p>No saved links yet.</p>
        <p class="hint">Click the Pouch icon in the toolbar to save your first link.</p>
      </div>
    `;
  },

  /**
   * Render no results message
   * @returns {string} HTML string
   */
  renderNoResults() {
    return '<p class="no-results">No links match your search.</p>';
  },

  /**
   * Render active filter tags
   * @param {Array} filterTags - Active filter tags
   * @returns {string} HTML string
   */
  renderActiveFilters(filterTags) {
    return filterTags
      .map(
        (t) =>
          `<button class="filter-tag" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)} &times;</button>`
      )
      .join("");
  },
};

// Make available globally and export for testing
(function (root) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = LinkRenderer;
  }
  if (typeof root !== "undefined") {
    root.LinkRenderer = LinkRenderer;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
