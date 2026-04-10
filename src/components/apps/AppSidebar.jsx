import { useMemo, useState } from "react";

const APPS = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    emoji: "💬",
    url: "https://web.whatsapp.com/",
  },
  {
    id: "gmail",
    name: "Gmail",
    emoji: "✉",
    url: "https://mail.google.com/",
  },
  {
    id: "calendar",
    name: "Calendar",
    emoji: "📅",
    url: "https://calendar.google.com/",
  },
  {
    id: "docs",
    name: "Docs",
    emoji: "📝",
    url: "https://docs.google.com/",
  },
];

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState("whatsapp");

  const activeApp = useMemo(
    () => APPS.find((app) => app.id === activeAppId) || APPS[0],
    [activeAppId],
  );

  return (
    <>
      <div className="app-dock" aria-label="Embedded apps">
        <button
          className={`app-dock-toggle ${open ? "active" : ""}`}
          onClick={() => setOpen((v) => !v)}
          title="Toggle app sidebar"
        >
          Apps
        </button>

        {APPS.map((app) => (
          <button
            key={app.id}
            className={`app-dock-btn ${activeAppId === app.id ? "active" : ""}`}
            onClick={() => {
              setActiveAppId(app.id);
              setOpen(true);
            }}
            title={app.name}
          >
            <span aria-hidden="true">{app.emoji}</span>
          </button>
        ))}
      </div>

      {open && (
        <aside className="app-sidebar-panel" aria-label="App sidebar panel">
          <div className="app-sidebar-header">
            <div className="app-sidebar-title">{activeApp.name}</div>
            <div className="app-sidebar-actions">
              <a
                href={activeApp.url}
                target="_blank"
                rel="noreferrer"
                className="app-sidebar-open-tab"
                title="Open in new tab"
              >
                Open
              </a>
              <button
                onClick={() => setOpen(false)}
                className="app-sidebar-close"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          <iframe
            src={activeApp.url}
            title={`${activeApp.name} embedded`}
            className="app-sidebar-frame"
          />
        </aside>
      )}
    </>
  );
}
