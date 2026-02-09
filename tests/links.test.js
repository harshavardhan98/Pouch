/**
 * @jest-environment jsdom
 */

describe("Links Page", () => {
  let mockLinks;
  let originalCreateElement;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Store original createElement
    originalCreateElement = document.createElement.bind(document);

    // Sample test data
    mockLinks = [
      {
        id: "link-1",
        url: "https://mysite.com/page",
        title: "Example Site",
        tags: ["work", "reference"],
        savedAt: "2024-01-15T10:00:00.000Z",
      },
      {
        id: "link-2",
        url: "https://test.com",
        title: "Test Page",
        tags: ["personal"],
        savedAt: "2024-01-16T10:00:00.000Z",
      },
      {
        id: "link-3",
        url: "https://docs.sample.com",
        title: "Documentation",
        tags: ["work", "docs"],
        savedAt: "2024-01-17T10:00:00.000Z",
      },
    ];

    // Set up DOM (including sidebar and toast elements)
    document.body.innerHTML = `
      <aside id="tag-sidebar" class="sidebar">
        <button id="sidebar-toggle" class="sidebar-toggle"></button>
        <div id="sidebar-content" class="sidebar-content"></div>
      </aside>
      <div class="main-content">
        <input type="text" id="search-input" />
        <div id="active-tags"></div>
        <div id="links-container"></div>
        <div id="empty-state" class="hidden"></div>
        <button id="export-btn">Export</button>
        <input type="file" id="import-input" />
        <input type="file" id="pocket-import-input" />
      </div>
      <div id="toast-container" class="toast-container"></div>
    `;

    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockImplementation((message) => {
      if (message.action === "getLinks") {
        return Promise.resolve([...mockLinks]);
      }
      if (message.action === "deleteLink") {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });

    // Mock chrome.storage.local.set
    chrome.storage.local.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore createElement if it was mocked
    if (document.createElement !== originalCreateElement) {
      document.createElement = originalCreateElement;
    }
    jest.restoreAllMocks();
  });

  function loadModules() {
    // Clear module cache
    jest.resetModules();

    // Load modules in order (they add to global scope)
    require("../links/modules/utils.js");
    require("../links/modules/csv-parser.js");
    require("../links/modules/link-renderer.js");
    require("../links/modules/tag-sidebar.js");
    require("../links/modules/toast.js");
  }

  function loadLinksScript() {
    loadModules();
    return require("../links/links.js");
  }

  async function waitForInit() {
    // Wait for async init to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  describe("Initialization", () => {
    test("should fetch links on init", async () => {
      loadLinksScript();
      await waitForInit();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "getLinks",
      });
    });

    test("should render all links on init", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      expect(container.querySelectorAll(".link-card").length).toBe(3);
    });

    test("should show empty state when no links", async () => {
      chrome.runtime.sendMessage.mockResolvedValue([]);
      loadLinksScript();
      await waitForInit();

      const emptyState = document.getElementById("empty-state");
      expect(emptyState.classList.contains("hidden")).toBe(false);
    });

    test("should render sidebar with tags", async () => {
      loadLinksScript();
      await waitForInit();

      const sidebarContent = document.getElementById("sidebar-content");
      expect(sidebarContent.innerHTML).toContain("Tags");
      expect(sidebarContent.querySelectorAll(".sidebar-tag").length).toBe(4); // work, reference, personal, docs
    });
  });

  describe("Search Filtering", () => {
    test("should filter links by title", async () => {
      loadLinksScript();
      await waitForInit();

      const searchInput = document.getElementById("search-input");
      searchInput.value = "Example Site";
      searchInput.dispatchEvent(new Event("input"));

      const container = document.getElementById("links-container");
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(1);
      expect(cards[0].querySelector(".link-title").textContent.trim()).toBe(
        "Example Site"
      );
    });

    test("should filter links by URL", async () => {
      loadLinksScript();
      await waitForInit();

      const searchInput = document.getElementById("search-input");
      searchInput.value = "test.com";
      searchInput.dispatchEvent(new Event("input"));

      const container = document.getElementById("links-container");
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(1);
      expect(cards[0].querySelector(".link-title").textContent.trim()).toBe(
        "Test Page"
      );
    });

    test("should filter links by tag", async () => {
      loadLinksScript();
      await waitForInit();

      const searchInput = document.getElementById("search-input");
      searchInput.value = "docs";
      searchInput.dispatchEvent(new Event("input"));

      const container = document.getElementById("links-container");
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(1);
    });

    test("should show no results message when search has no matches", async () => {
      loadLinksScript();
      await waitForInit();

      const searchInput = document.getElementById("search-input");
      searchInput.value = "nonexistent";
      searchInput.dispatchEvent(new Event("input"));

      const container = document.getElementById("links-container");
      expect(container.textContent).toContain("No links match your search");
    });

    test("should be case insensitive", async () => {
      loadLinksScript();
      await waitForInit();

      const searchInput = document.getElementById("search-input");
      searchInput.value = "TEST PAGE";
      searchInput.dispatchEvent(new Event("input"));

      const container = document.getElementById("links-container");
      expect(container.querySelectorAll(".link-card").length).toBe(1);
    });
  });

  describe("Tag Filtering", () => {
    test("should filter by tag when tag is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const workTag = container.querySelector('.tag[data-tag="work"]');
      workTag.click();

      await waitForInit();

      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(2); // "Example Site" and "Documentation" have "work" tag
    });

    test("should show active tag filter", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const workTag = container.querySelector('.tag[data-tag="work"]');
      workTag.click();

      const activeTags = document.getElementById("active-tags");
      expect(activeTags.querySelector(".filter-tag")).not.toBeNull();
      expect(activeTags.textContent).toContain("work");
    });

    test("should remove tag filter when filter tag is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      // Add filter
      const container = document.getElementById("links-container");
      const workTag = container.querySelector('.tag[data-tag="work"]');
      workTag.click();

      // Remove filter
      const activeTags = document.getElementById("active-tags");
      const filterTag = activeTags.querySelector(".filter-tag");
      filterTag.click();

      // Should show all links again
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(3);
    });

    test("should support multiple tag filters (AND logic)", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");

      // Click "work" tag
      const workTag = container.querySelector('.tag[data-tag="work"]');
      workTag.click();

      // Click "docs" tag
      const docsTag = container.querySelector('.tag[data-tag="docs"]');
      docsTag.click();

      // Only "Documentation" has both "work" AND "docs"
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(1);
      expect(cards[0].querySelector(".link-title").textContent.trim()).toBe(
        "Documentation"
      );
    });
  });

  describe("Sidebar Tag Filtering", () => {
    test("should filter by tag when sidebar tag is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      const sidebarContent = document.getElementById("sidebar-content");
      const workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      workTag.click();

      const container = document.getElementById("links-container");
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(2);
    });

    test("should toggle tag filter when sidebar tag is clicked again", async () => {
      loadLinksScript();
      await waitForInit();

      const sidebarContent = document.getElementById("sidebar-content");

      // Add filter
      let workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      workTag.click();
      let cards = document.getElementById("links-container").querySelectorAll(".link-card");
      expect(cards.length).toBe(2);

      // Remove filter - re-query because sidebar was re-rendered
      workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      workTag.click();
      cards = document.getElementById("links-container").querySelectorAll(".link-card");
      expect(cards.length).toBe(3);
    });

    test("should show tag counts in sidebar", async () => {
      loadLinksScript();
      await waitForInit();

      const sidebarContent = document.getElementById("sidebar-content");
      const workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      const countElement = workTag.querySelector(".sidebar-tag-count");

      expect(countElement.textContent).toBe("2"); // work appears on 2 links
    });

    test("should highlight active tag in sidebar", async () => {
      loadLinksScript();
      await waitForInit();

      const sidebarContent = document.getElementById("sidebar-content");
      const workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');

      workTag.click();

      // Re-query after render
      const updatedWorkTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      expect(updatedWorkTag.classList.contains("active")).toBe(true);
    });

    test("should clear all filters when clear button is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      // Add a filter first
      const sidebarContent = document.getElementById("sidebar-content");
      const workTag = sidebarContent.querySelector('.sidebar-tag[data-tag="work"]');
      workTag.click();

      // Click clear filters
      const clearBtn = sidebarContent.querySelector("#clear-filters");
      clearBtn.click();

      // Should show all links
      const cards = document.getElementById("links-container").querySelectorAll(".link-card");
      expect(cards.length).toBe(3);
    });
  });

  describe("Delete Link with Undo", () => {
    async function initWithFakeTimers() {
      loadLinksScript();
      // Run the microtask queue for async init
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();
    }

    test("should remove link from DOM immediately when delete button is clicked", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      // Link should be removed from DOM immediately
      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(2);

      // But storage deletion should NOT be called yet (only getLinks was called)
      const deleteCalls = chrome.runtime.sendMessage.mock.calls.filter(
        (call) => call[0].action === "deleteLink"
      );
      expect(deleteCalls.length).toBe(0);

      jest.useRealTimers();
    });

    test("should show undo toast when link is deleted", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      // Advance just enough for requestAnimationFrame but not the expiration timer
      jest.advanceTimersByTime(100);

      const toastContainer = document.getElementById("toast-container");
      expect(toastContainer.querySelector(".toast")).not.toBeNull();
      expect(toastContainer.textContent).toContain("Link deleted");
      expect(toastContainer.querySelector("#toast-undo-btn")).not.toBeNull();

      jest.useRealTimers();
    });

    test("should restore link when undo is clicked", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      // Link should be removed
      expect(container.querySelectorAll(".link-card").length).toBe(2);

      // Click undo
      const toastContainer = document.getElementById("toast-container");
      const undoBtn = toastContainer.querySelector("#toast-undo-btn");
      undoBtn.click();

      // Link should be restored
      expect(container.querySelectorAll(".link-card").length).toBe(3);
      expect(container.querySelector('.link-card[data-id="link-1"]')).not.toBeNull();

      // Storage deletion should NOT have been called
      const deleteCalls = chrome.runtime.sendMessage.mock.calls.filter(
        (call) => call[0].action === "deleteLink"
      );
      expect(deleteCalls.length).toBe(0);

      jest.useRealTimers();
    });

    test("should permanently delete after toast expires", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      // Fast-forward past the toast duration (5000ms)
      jest.advanceTimersByTime(5100);

      // Now storage deletion should be called
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "deleteLink",
        id: "link-1",
      });

      jest.useRealTimers();
    });

    test("should remove the correct link from DOM", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-2"]');
      deleteBtn.click();

      const deletedCard = container.querySelector('.link-card[data-id="link-2"]');
      expect(deletedCard).toBeNull();

      // Other links should still be present
      expect(container.querySelector('.link-card[data-id="link-1"]')).not.toBeNull();
      expect(container.querySelector('.link-card[data-id="link-3"]')).not.toBeNull();
    });

    test("should update sidebar tag counts after delete", async () => {
      loadLinksScript();
      await waitForInit();

      // Delete link-2 which has "personal" tag
      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-2"]');
      deleteBtn.click();

      // "personal" tag should no longer appear in sidebar
      const sidebarContent = document.getElementById("sidebar-content");
      const personalTag = sidebarContent.querySelector('.sidebar-tag[data-tag="personal"]');
      expect(personalTag).toBeNull();
    });

    test("should hide toast when close button is clicked", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      // Click close button
      const toastContainer = document.getElementById("toast-container");
      const closeBtn = toastContainer.querySelector("#toast-close-btn");
      closeBtn.click();

      // Storage deletion should be called (same as expire)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "deleteLink",
        id: "link-1",
      });

      jest.useRealTimers();
    });

    test("should restore link at original position when undone", async () => {
      jest.useFakeTimers();
      await initWithFakeTimers();

      const container = document.getElementById("links-container");

      // Delete the second link
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-2"]');
      deleteBtn.click();

      // Click undo
      const toastContainer = document.getElementById("toast-container");
      const undoBtn = toastContainer.querySelector("#toast-undo-btn");
      undoBtn.click();

      // Check the order - link-2 should be in the middle
      const cards = container.querySelectorAll(".link-card");
      expect(cards[0].dataset.id).toBe("link-1");
      expect(cards[1].dataset.id).toBe("link-2");
      expect(cards[2].dataset.id).toBe("link-3");

      jest.useRealTimers();
    });
  });

  describe("Export", () => {
    test("should create download when export button is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockUrl = "blob:test-url";
      global.URL.createObjectURL = jest.fn(() => mockUrl);
      global.URL.revokeObjectURL = jest.fn();

      // Track anchor creation and click
      let createdAnchor = null;
      const realCreateElement = originalCreateElement;
      jest.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "a") {
          createdAnchor = realCreateElement("a");
          jest.spyOn(createdAnchor, "click").mockImplementation(() => {});
          return createdAnchor;
        }
        return realCreateElement(tag);
      });

      const exportBtn = document.getElementById("export-btn");
      exportBtn.click();

      // Wait for async export to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(createdAnchor).not.toBeNull();
      expect(createdAnchor.click).toHaveBeenCalled();
      expect(createdAnchor.download).toMatch(/pouch-export-.*\.json/);
    });
  });

  describe("Import", () => {
    function createMockFile(content, name = "import.json") {
      const blob = new Blob([content], { type: "application/json" });
      blob.name = name;
      blob.text = () => Promise.resolve(content);
      return blob;
    }

    test("should import links from valid JSON file", async () => {
      loadLinksScript();
      await waitForInit();

      const importInput = document.getElementById("import-input");
      const newLinks = [
        {
          url: "https://newsite.com",
          title: "New Site",
          tags: ["imported"],
        },
      ];

      const file = createMockFile(JSON.stringify(newLinks));

      Object.defineProperty(importInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      importInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith("Imported 1 new link.");
    });

    test("should skip duplicate URLs during import", async () => {
      loadLinksScript();
      await waitForInit();

      const importInput = document.getElementById("import-input");
      const duplicateLinks = [
        {
          url: "https://mysite.com/page", // Already exists
          title: "Duplicate",
          tags: [],
        },
      ];

      const file = createMockFile(JSON.stringify(duplicateLinks));

      Object.defineProperty(importInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      importInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.alert).toHaveBeenCalledWith("Imported 0 new links.");
    });

    test("should show error for invalid JSON", async () => {
      loadLinksScript();
      await waitForInit();

      const importInput = document.getElementById("import-input");
      const file = createMockFile("not valid json");

      Object.defineProperty(importInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      importInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.alert).toHaveBeenCalledWith("Invalid JSON file.");
    });

    test("should show error for non-array JSON", async () => {
      loadLinksScript();
      await waitForInit();

      const importInput = document.getElementById("import-input");
      const file = createMockFile('{"not": "array"}');

      Object.defineProperty(importInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      importInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.alert).toHaveBeenCalledWith(
        "Invalid format. Expected an array of links."
      );
    });
  });

  describe("Pocket CSV Import", () => {
    function createMockCSVFile(content) {
      const blob = new Blob([content], { type: "text/csv" });
      blob.name = "pocket-export.csv";
      blob.text = () => Promise.resolve(content);
      return blob;
    }

    test("should import links from valid Pocket CSV", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
Unix Toolbox,http://example.com/unix,1582312900,sre,unread
Another Page,https://another.com/,1592198922,hacking,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        "Imported 2 new links from Pocket."
      );
    });

    test("should parse pipe-separated tags", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
Multi Tag Link,https://multitag.com/,1706156469,tag1|tag2|tag3,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check that storage was called with the correct tags
      const setCall = chrome.storage.local.set.mock.calls[0][0];
      const importedLink = setCall.links.find(
        (l) => l.url === "https://multitag.com/"
      );
      expect(importedLink.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    test("should handle links with no tags", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
No Tags Link,https://notags.com/,1592332152,,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const setCall = chrome.storage.local.set.mock.calls[0][0];
      const importedLink = setCall.links.find(
        (l) => l.url === "https://notags.com/"
      );
      expect(importedLink.tags).toEqual([]);
    });

    test("should convert Unix timestamp to ISO date", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      // 1582312900 = 2020-02-21 (date in UTC)
      const csvContent = `title,url,time_added,tags,status
Dated Link,https://dated.com/,1582312900,test,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const setCall = chrome.storage.local.set.mock.calls[0][0];
      const importedLink = setCall.links.find(
        (l) => l.url === "https://dated.com/"
      );
      // Check that the date is correctly parsed (verify it's an ISO string from the timestamp)
      const parsedDate = new Date(importedLink.savedAt);
      expect(parsedDate.getTime()).toBe(1582312900 * 1000);
      expect(importedLink.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test("should skip duplicate URLs from Pocket import", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
Duplicate,https://mysite.com/page,1582312900,test,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.alert).toHaveBeenCalledWith(
        "Imported 0 new links from Pocket."
      );
    });

    test("should handle quoted fields with commas", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
"Title, with comma",https://comma.com/,1582312900,test,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const setCall = chrome.storage.local.set.mock.calls[0][0];
      const importedLink = setCall.links.find(
        (l) => l.url === "https://comma.com/"
      );
      expect(importedLink.title).toBe("Title, with comma");
    });

    test("should show error for empty CSV", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(global.alert).toHaveBeenCalledWith(
        "No links found in the CSV file."
      );
    });

    test("should convert tags to lowercase", async () => {
      loadLinksScript();
      await waitForInit();

      const pocketInput = document.getElementById("pocket-import-input");
      const csvContent = `title,url,time_added,tags,status
Case Test,https://case.com/,1582312900,UPPERCASE|MixedCase,unread`;

      const file = createMockCSVFile(csvContent);

      Object.defineProperty(pocketInput, "files", {
        value: [file],
        configurable: true,
      });

      global.alert = jest.fn();

      pocketInput.dispatchEvent(new Event("change"));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const setCall = chrome.storage.local.set.mock.calls[0][0];
      const importedLink = setCall.links.find(
        (l) => l.url === "https://case.com/"
      );
      expect(importedLink.tags).toEqual(["uppercase", "mixedcase"]);
    });
  });

  describe("Link Card Rendering", () => {
    test("should render link title as clickable link", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const link = container.querySelector(".link-title");

      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBe("https://mysite.com/page");
      expect(link.target).toBe("_blank");
    });

    test("should render tags for each link", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const firstCard = container.querySelector('.link-card[data-id="link-1"]');
      const tags = firstCard.querySelectorAll(".tag");

      expect(tags.length).toBe(2);
      expect(tags[0].textContent).toBe("work");
      expect(tags[1].textContent).toBe("reference");
    });

    test("should format date correctly", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const firstCard = container.querySelector('.link-card[data-id="link-1"]');
      const dateElement = firstCard.querySelector(".link-date");

      // Date format: "Jan 15, 2024" (or similar based on locale)
      expect(dateElement.textContent).toMatch(/Jan\s+15,\s+2024/);
    });

    test("should escape HTML in title and displayed URL", async () => {
      const xssLinks = [
        {
          id: "xss-link",
          url: "https://safe.com/<script>alert('xss')</script>",
          title: "<img src=x onerror=alert('xss')>",
          tags: [],
          savedAt: "2024-01-15T10:00:00.000Z",
        },
      ];

      chrome.runtime.sendMessage.mockResolvedValue(xssLinks);
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");

      // Title text content should be escaped
      const titleElement = container.querySelector(".link-title");
      expect(titleElement.textContent.trim()).toBe("<img src=x onerror=alert('xss')>");

      // Displayed URL should be escaped
      const urlElement = container.querySelector(".link-url");
      expect(urlElement.innerHTML).toContain("&lt;script&gt;");

      // Verify no script actually executes (text content is safe)
      expect(urlElement.textContent).toContain("<script>");
    });
  });
});
