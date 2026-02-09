/**
 * Toast Notification Component
 * Shows temporary notifications with optional action buttons
 */

const Toast = {
  container: null,
  activeToast: null,
  timeoutId: null,

  /**
   * Initialize the toast system
   * @param {HTMLElement} container - Toast container element
   */
  init(container) {
    this.container = container;
    this._bindEvents();
  },

  /**
   * Show a toast with an undo action
   * @param {Object} options
   * @param {string} options.message - Message to display
   * @param {Function} options.onUndo - Callback when undo is clicked
   * @param {Function} options.onExpire - Callback when toast expires without undo
   * @param {number} options.duration - Duration in ms (default: 5000)
   */
  showUndo(options) {
    const { message, onUndo, onExpire, duration = 5000 } = options;

    // Clear any existing toast
    this._clearActiveToast();

    // Store callbacks
    this.activeToast = {
      onUndo,
      onExpire,
    };

    // Render toast
    this.container.innerHTML = `
      <div class="toast toast-undo">
        <span class="toast-message">${Utils.escapeHtml(message)}</span>
        <button class="toast-action" id="toast-undo-btn">Undo</button>
        <button class="toast-close" id="toast-close-btn" aria-label="Close">&times;</button>
      </div>
    `;

    // Show with animation
    requestAnimationFrame(() => {
      const toast = this.container.querySelector(".toast");
      if (toast) toast.classList.add("visible");
    });

    // Set expiration timer
    this.timeoutId = setTimeout(() => {
      this._expire();
    }, duration);
  },

  /**
   * Hide the current toast
   */
  hide() {
    this._clearActiveToast();
  },

  /**
   * Bind event listeners
   * @private
   */
  _bindEvents() {
    this.container.addEventListener("click", (e) => {
      if (e.target.id === "toast-undo-btn") {
        this._handleUndo();
        return;
      }

      if (e.target.id === "toast-close-btn") {
        this._expire();
      }
    });
  },

  /**
   * Handle undo button click
   * @private
   */
  _handleUndo() {
    if (this.activeToast && this.activeToast.onUndo) {
      this.activeToast.onUndo();
    }
    this._clearActiveToast();
  },

  /**
   * Handle toast expiration
   * @private
   */
  _expire() {
    if (this.activeToast && this.activeToast.onExpire) {
      this.activeToast.onExpire();
    }
    this._clearActiveToast();
  },

  /**
   * Clear the active toast
   * @private
   */
  _clearActiveToast() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const toast = this.container.querySelector(".toast");
    if (toast) {
      toast.classList.remove("visible");
      // Remove after animation
      setTimeout(() => {
        this.container.innerHTML = "";
      }, 200);
    } else {
      this.container.innerHTML = "";
    }

    this.activeToast = null;
  },
};

// Make available globally and export for testing
(function (root) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Toast;
  }
  if (typeof root !== "undefined") {
    root.Toast = Toast;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
