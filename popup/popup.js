const pageTitle = document.getElementById("page-title");
const pageUrl = document.getElementById("page-url");
const tagInput = document.getElementById("tag-input");
const tagList = document.getElementById("tag-list");
const saveBtn = document.getElementById("save-btn");
const viewAll = document.getElementById("view-all");
const status = document.getElementById("status");

let currentTab = null;
let tags = [];

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  pageTitle.textContent = tab.title || "Untitled";
  pageUrl.textContent = tab.url;

  // Check if already saved
  const links = await chrome.runtime.sendMessage({ action: "getLinks" });
  const existing = links.find((l) => l.url === tab.url);
  if (existing) {
    tags = [...existing.tags];
    renderTags();
    showStatus("This link is already saved", "info");
    saveBtn.textContent = "Update Tags";
  }
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}

function renderTags() {
  tagList.innerHTML = "";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.innerHTML = `${escapeHtml(tag)}<button class="remove-tag" data-tag="${escapeHtml(tag)}">&times;</button>`;
    tagList.appendChild(span);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

tagInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const value = tagInput.value.trim().toLowerCase();
  if (!value) return;
  if (tags.includes(value)) {
    tagInput.value = "";
    return;
  }

  tags.push(value);
  tagInput.value = "";
  renderTags();
});

tagList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-tag")) return;
  const tag = e.target.dataset.tag;
  tags = tags.filter((t) => t !== tag);
  renderTags();
});

saveBtn.addEventListener("click", async () => {
  if (!currentTab) return;

  saveBtn.disabled = true;

  // Check if updating an existing link
  const links = await chrome.runtime.sendMessage({ action: "getLinks" });
  const existing = links.find((l) => l.url === currentTab.url);

  if (existing) {
    const result = await chrome.runtime.sendMessage({
      action: "updateLink",
      id: existing.id,
      data: { tags },
    });
    if (result.success) {
      showStatus("Tags updated!", "success");
    }
  } else {
    const result = await chrome.runtime.sendMessage({
      action: "saveLink",
      data: {
        url: currentTab.url,
        title: currentTab.title,
        tags,
      },
    });

    if (result.success) {
      showStatus("Link saved!", "success");
    } else if (result.reason === "duplicate") {
      showStatus("This link is already saved", "info");
    }
  }

  saveBtn.disabled = false;
});

viewAll.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("links/links.html") });
});

init();
