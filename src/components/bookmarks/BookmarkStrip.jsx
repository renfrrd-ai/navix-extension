import { useEffect, useMemo, useState } from "react";

const MAX_BOOKMARKS = 14;

function getFavicon(url) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

function normalizeBookmark(node) {
  if (!node || !node.url || !node.title) return null;
  return {
    id: node.id,
    title: node.title.trim(),
    url: node.url,
  };
}

async function readBookmarkBar() {
  if (!globalThis.chrome?.bookmarks) return [];

  try {
    const children = await chrome.bookmarks.getChildren("1");
    return children
      .map(normalizeBookmark)
      .filter(Boolean)
      .slice(0, MAX_BOOKMARKS);
  } catch {
    return [];
  }
}

export default function BookmarkStrip() {
  const [bookmarks, setBookmarks] = useState([]);
  const [available, setAvailable] = useState(true);

  const hasBookmarks = useMemo(() => bookmarks.length > 0, [bookmarks]);

  async function refresh() {
    if (!globalThis.chrome?.bookmarks) {
      setAvailable(false);
      return;
    }

    const items = await readBookmarkBar();
    setBookmarks(items);
    setAvailable(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddBookmark() {
    if (!globalThis.chrome?.bookmarks) return;

    const title = window.prompt("Bookmark title");
    if (!title || !title.trim()) return;

    const url = window.prompt("Bookmark URL (https://...)");
    if (!url || !url.trim()) return;

    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return;
      }

      await chrome.bookmarks.create({
        parentId: "1",
        title: title.trim().slice(0, 64),
        url: parsed.toString(),
      });

      await refresh();
    } catch {
      // Ignore invalid URLs and API failures silently in this lightweight UI.
    }
  }

  if (!available) {
    return null;
  }

  return (
    <div className="bookmark-strip-shell">
      <div className="bookmark-strip-header">
        <span className="bookmark-strip-title">Bookmarks</span>
        <button
          className="bookmark-add-btn"
          onClick={handleAddBookmark}
          title="Add bookmark"
        >
          +
        </button>
      </div>

      {!hasBookmarks && (
        <div className="bookmark-empty">
          No bookmarks yet. Add one to pin it here.
        </div>
      )}

      {hasBookmarks && (
        <div className="bookmark-row" role="navigation" aria-label="Bookmarks">
          {bookmarks.map((item) => (
            <a
              key={item.id}
              href={item.url}
              title={item.title}
              className="bookmark-pill"
            >
              <img
                src={getFavicon(item.url)}
                alt=""
                className="bookmark-favicon"
              />
              <span className="bookmark-label">{item.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
