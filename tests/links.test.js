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

    // Set up DOM
    document.body.innerHTML = `
      <input type="text" id="search-input" />
      <div id="active-tags"></div>
      <div id="links-container"></div>
      <div id="empty-state" class="hidden"></div>
      <button id="export-btn">Export</button>
      <input type="file" id="import-input" />
      <input type="file" id="pocket-import-input" />
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

  function loadLinksScript() {
    // Clear module cache to reload fresh
    jest.resetModules();
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
      expect(cards[0].querySelector(".link-title").textContent).toBe(
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
      expect(cards[0].querySelector(".link-title").textContent).toBe(
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
      expect(cards[0].querySelector(".link-title").textContent).toBe(
        "Documentation"
      );
    });
  });

  describe("Delete Link", () => {
    test("should delete link when delete button is clicked", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-1"]');
      deleteBtn.click();

      await waitForInit();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "deleteLink",
        id: "link-1",
      });

      const cards = container.querySelectorAll(".link-card");
      expect(cards.length).toBe(2);
    });

    test("should remove the correct link from DOM", async () => {
      loadLinksScript();
      await waitForInit();

      const container = document.getElementById("links-container");
      const deleteBtn = container.querySelector('.delete-btn[data-id="link-2"]');
      deleteBtn.click();

      await waitForInit();

      const deletedCard = container.querySelector('.link-card[data-id="link-2"]');
      expect(deletedCard).toBeNull();
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
      expect(titleElement.textContent).toBe("<img src=x onerror=alert('xss')>");

      // Displayed URL should be escaped
      const urlElement = container.querySelector(".link-url");
      expect(urlElement.innerHTML).toContain("&lt;script&gt;");

      // Verify no script actually executes (text content is safe)
      expect(urlElement.textContent).toContain("<script>");
    });
  });
});
