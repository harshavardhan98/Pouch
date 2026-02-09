/**
 * CSV Parser for Pocket export format
 */

const CSVParser = {
  /**
   * Parse Pocket CSV export format
   * Format: title,url,time_added,tags,status
   * Tags are pipe-separated (tag1|tag2|tag3)
   *
   * @param {string} csvText - Raw CSV text
   * @returns {Array<{title: string, url: string, savedAt: string, tags: string[]}>}
   */
  parsePocketCSV(csvText) {
    const lines = this._splitLines(csvText);

    // Skip header row
    if (lines.length === 0) return [];
    const dataLines = lines.slice(1);

    return dataLines.map((line) => this._parseLine(line));
  },

  /**
   * Split CSV text into lines, handling quoted fields with newlines
   * @private
   */
  _splitLines(csvText) {
    const lines = [];
    let current = "";
    let inQuotes = false;

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

    return lines;
  },

  /**
   * Parse a single CSV line into fields
   * @private
   */
  _parseLine(line) {
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
      tags: tags
        ? tags
            .split("|")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [],
    };
  },
};

// Make available globally and export for testing
(function (root) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CSVParser;
  }
  if (typeof root !== "undefined") {
    root.CSVParser = CSVParser;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this);
