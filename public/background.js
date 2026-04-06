chrome.runtime.onInstalled.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description:
      "Open Navix and run any command like <match>g Hello World</match>",
  });
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
