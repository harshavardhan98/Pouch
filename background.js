chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-pouch",
    title: "Save to Pouch",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-pouch") return;

  const url = info.linkUrl || info.pageUrl;
  const title = info.linkUrl ? info.linkUrl : tab.title;

  await saveLink({ url, title, tags: [] });
});

async function saveLink({ url, title, tags }) {
  const { links = [] } = await chrome.storage.local.get("links");

  const exists = links.some((link) => link.url === url);
  if (exists) return { success: false, reason: "duplicate" };

  const link = {
    id: crypto.randomUUID(),
    url,
    title: title || url,
    tags,
    savedAt: new Date().toISOString(),
  };

  links.unshift(link);
  await chrome.storage.local.set({ links });
  return { success: true, link };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "saveLink") {
    saveLink(message.data).then(sendResponse);
    return true; // keep channel open for async response
  }

  if (message.action === "getLinks") {
    chrome.storage.local.get("links").then(({ links = [] }) => {
      sendResponse(links);
    });
    return true;
  }

  if (message.action === "deleteLink") {
    chrome.storage.local.get("links").then(({ links = [] }) => {
      const filtered = links.filter((l) => l.id !== message.id);
      chrome.storage.local.set({ links: filtered }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === "updateLink") {
    chrome.storage.local.get("links").then(({ links = [] }) => {
      const index = links.findIndex((l) => l.id === message.id);
      if (index === -1) {
        sendResponse({ success: false });
        return;
      }
      links[index] = { ...links[index], ...message.data };
      chrome.storage.local.set({ links }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
