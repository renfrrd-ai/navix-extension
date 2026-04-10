async function configureSidePanel() {
  if (!chrome.sidePanel?.setPanelBehavior) return;

  try {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  } catch (err) {
    console.warn("[Navix SidePanel] setPanelBehavior failed", err);
  }

  if (chrome.sidePanel?.setOptions) {
    try {
      await chrome.sidePanel.setOptions({
        path: "sidepanel.html",
        enabled: true,
      });
    } catch (err) {
      console.warn("[Navix SidePanel] setOptions failed", err);
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description:
      "Open Navix and run any command like <match>g Hello World</match>",
  });

  configureSidePanel();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
});

chrome.tabs.onUpdated.addListener(() => {
  configureSidePanel();
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const query = text.trim();
  const url = new URL(chrome.runtime.getURL("index.html"));

  if (query) {
    url.searchParams.set("command", query);
    url.searchParams.set("autorun", "1");
  }

  chrome.tabs.create({ url: url.toString() });
});
