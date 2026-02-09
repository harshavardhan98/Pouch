/**
 * Utility functions for the links page
 */

const Utils = {
  /**
   * Escape HTML entities to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format a date string to a readable format
   * @param {string} isoString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(isoString) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  },

  /**
   * Debounce a function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },
};

// Make available globally and export for testing
(function (root) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Utils;
  }
  if (typeof root !== "undefined") {
    root.Utils = Utils;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
