const STORAGE_KEYS = {
  messages: "navix_sidepanel_messages_v2",
  tasks: "navix_sidepanel_tasks_v1",
  daily: "navix_sidepanel_daily_v1",
  appHistory: "navix_sidepanel_app_history_v1",
};

const MAX_MESSAGES = 120;
const MAX_TASKS = 200;
const MAX_APP_HISTORY = 20;

const DAILY_HABITS = [
  { id: "plan", label: "Planned my top 3" },
  { id: "deep", label: "One deep-work block" },
  { id: "move", label: "Moved my body" },
  { id: "review", label: "Reviewed and closed the day" },
];

const APP_CONNECTORS = [
  {
    alias: "wa",
    name: "WhatsApp",
    description: "Open WhatsApp or start a quick message intent.",
    example: "wa john",
    defaultAction: "chat",
    actions: {
      open: {
        label: "Open",
        requiresInput: false,
        build: () => "https://web.whatsapp.com/",
      },
      chat: {
        label: "Chat",
        requiresInput: true,
        build: (value) => `https://wa.me/?text=${encodeURIComponent(value)}`,
      },
    },
  },
  {
    alias: "yt",
    name: "YouTube",
    description: "Jump to YouTube home or search instantly.",
    example: "yt lofi mix",
    defaultAction: "search",
    actions: {
      open: {
        label: "Open",
        requiresInput: false,
        build: () => "https://www.youtube.com/",
      },
      search: {
        label: "Search",
        requiresInput: true,
        build: (value) =>
          `https://www.youtube.com/results?search_query=${encodeURIComponent(value)}`,
      },
    },
  },
  {
    alias: "gh",
    name: "GitHub",
    description: "Open GitHub or jump to repo/search.",
    example: "gh vercel/next.js",
    defaultAction: "jump",
    actions: {
      open: {
        label: "Open",
        requiresInput: false,
        build: () => "https://github.com/",
      },
      jump: {
        label: "Repo/Search",
        requiresInput: true,
        build: (value) => {
          const clean = value.trim();
          const repoPattern = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
          if (repoPattern.test(clean)) {
            return `https://github.com/${clean}`;
          }
          return `https://github.com/search?q=${encodeURIComponent(clean)}`;
        },
      },
    },
  },
  {
    alias: "gm",
    name: "Gmail",
    description: "Open inbox or search mail.",
    example: "gm invoice april",
    defaultAction: "search",
    actions: {
      open: {
        label: "Open",
        requiresInput: false,
        build: () => "https://mail.google.com/mail/u/0/#inbox",
      },
      search: {
        label: "Search",
        requiresInput: true,
        build: (value) =>
          `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(value)}`,
      },
    },
  },
];

const APP_BY_ALIAS = new Map(APP_CONNECTORS.map((app) => [app.alias, app]));

const tabs = Array.from(document.querySelectorAll("[data-tab]"));
const panels = Array.from(document.querySelectorAll("[data-panel]"));
const todayLabelEl = document.getElementById("todayLabel");

const messagesEl = document.getElementById("messages");
const assistantFormEl = document.getElementById("assistantForm");
const assistantInputEl = document.getElementById("assistantInput");
const clearChatBtnEl = document.getElementById("clearChatBtn");

const taskFormEl = document.getElementById("taskForm");
const taskInputEl = document.getElementById("taskInput");
const taskListEl = document.getElementById("taskList");
const taskStatsEl = document.getElementById("taskStats");
const clearDoneBtnEl = document.getElementById("clearDoneBtn");

const dailyMoodEl = document.getElementById("dailyMood");
const dailyFocusEl = document.getElementById("dailyFocus");
const dailyNotesEl = document.getElementById("dailyNotes");
const dailyHabitsEl = document.getElementById("dailyHabits");
const dailyStreakEl = document.getElementById("dailyStreak");
const dailyStatusEl = document.getElementById("dailyStatus");
const dailySaveBtnEl = document.getElementById("dailySaveBtn");

const appCmdFormEl = document.getElementById("appCmdForm");
const appCmdInputEl = document.getElementById("appCmdInput");
const appStatusEl = document.getElementById("appStatus");
const appConnectorGridEl = document.getElementById("appConnectorGrid");
const appHistoryEl = document.getElementById("appHistory");

const state = {
  activeTab: "assistant",
  messages: [],
  tasks: [],
  dailyByDate: {},
  appHistory: [],
};

let dailyPersistTimer = null;

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 9)}`;
}

function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTodayLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function readStorage(keys) {
  return chrome.storage.local.get(keys).catch(() => ({}));
}

function writeStorage(payload) {
  return chrome.storage.local.set(payload).catch(() => undefined);
}

function normalizeMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry) => entry && (entry.role === "user" || entry.role === "assistant"),
    )
    .map((entry) => ({
      role: entry.role,
      content: String(entry.content || ""),
      ts: Number(entry.ts || Date.now()),
    }))
    .slice(-MAX_MESSAGES);
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry.title === "string")
    .map((entry) => ({
      id: String(entry.id || makeId()),
      title: entry.title.trim(),
      done: Boolean(entry.done),
      createdAt: Number(entry.createdAt || Date.now()),
      updatedAt: Number(entry.updatedAt || Date.now()),
    }))
    .filter((entry) => entry.title)
    .slice(-MAX_TASKS);
}

function normalizeDaily(value) {
  if (!value || typeof value !== "object") return {};
  const normalized = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const safeEntry = entry && typeof entry === "object" ? entry : {};
    const habits = {};
    for (const habit of DAILY_HABITS) {
      habits[habit.id] = Boolean(safeEntry.habits?.[habit.id]);
    }
    normalized[key] = {
      mood: String(safeEntry.mood || ""),
      focusMinutes:
        Number.parseInt(String(safeEntry.focusMinutes || 0), 10) || 0,
      notes: String(safeEntry.notes || ""),
      habits,
      updatedAt: Number(safeEntry.updatedAt || Date.now()),
    };
  }
  return normalized;
}

function normalizeAppHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry.command === "string" &&
        typeof entry.url === "string",
    )
    .map((entry) => ({
      id: String(entry.id || makeId()),
      command: String(entry.command),
      url: String(entry.url),
      ts: Number(entry.ts || Date.now()),
    }))
    .slice(0, MAX_APP_HISTORY);
}

function defaultDailyEntry() {
  const habits = {};
  for (const habit of DAILY_HABITS) {
    habits[habit.id] = false;
  }
  return {
    mood: "",
    focusMinutes: 0,
    notes: "",
    habits,
    updatedAt: Date.now(),
  };
}

function todayDailyEntry() {
  const key = dayKey();
  if (!state.dailyByDate[key]) {
    state.dailyByDate[key] = defaultDailyEntry();
  }
  return state.dailyByDate[key];
}

function setActiveTab(tab) {
  state.activeTab = tab;
  tabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === tab;
    panel.hidden = !active;
  });
}

function persistMessages() {
  return writeStorage({ [STORAGE_KEYS.messages]: state.messages });
}

function appendMessage(role, content) {
  state.messages.push({ role, content, ts: Date.now() });
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }
  renderMessages();
  persistMessages();
}

function renderMessages() {
  messagesEl.innerHTML = "";
  for (const msg of state.messages) {
    const bubble = document.createElement("div");
    bubble.className = `message ${msg.role}`;
    bubble.textContent = msg.content;
    messagesEl.appendChild(bubble);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function callAssistant(promptText) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `Noted: \"${promptText}\"\n\nThis side panel is ready for backend LLM wiring in callAssistant().`,
      );
    }, 220);
  });
}

function persistTasks() {
  return writeStorage({ [STORAGE_KEYS.tasks]: state.tasks });
}

function taskCounts() {
  const done = state.tasks.filter((task) => task.done).length;
  return {
    total: state.tasks.length,
    done,
    open: state.tasks.length - done,
  };
}

function renderTasks() {
  taskListEl.innerHTML = "";
  const { total, open, done } = taskCounts();
  taskStatsEl.textContent = `${open} open • ${done} done • ${total} total`;

  if (!state.tasks.length) {
    const empty = document.createElement("li");
    empty.className = "task-item";
    empty.textContent = "No tasks yet. Add one above.";
    taskListEl.appendChild(empty);
    return;
  }

  for (const task of state.tasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " is-done" : ""}`;
    item.dataset.taskId = task.id;

    const left = document.createElement("label");
    left.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.role = "toggle";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    left.appendChild(checkbox);
    left.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "chip-btn";
    edit.dataset.role = "edit";
    edit.textContent = "Edit";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "chip-btn danger";
    del.dataset.role = "delete";
    del.textContent = "Delete";

    actions.appendChild(edit);
    actions.appendChild(del);

    item.appendChild(left);
    item.appendChild(actions);
    taskListEl.appendChild(item);
  }
}

function setDailyStatus(message, isError = false) {
  dailyStatusEl.textContent = message;
  dailyStatusEl.classList.toggle("error", isError);
}

function isTrackedDay(entry) {
  if (!entry) return false;
  const minutes = Number(entry.focusMinutes) || 0;
  const notes = String(entry.notes || "").trim();
  const mood = String(entry.mood || "").trim();
  const habitsDone = Object.values(entry.habits || {}).some(Boolean);
  return minutes > 0 || notes.length > 0 || mood.length > 0 || habitsDone;
}

function dailyStreak() {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = dayKey(cursor);
    if (!isTrackedDay(state.dailyByDate[key])) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderDaily() {
  const entry = todayDailyEntry();
  dailyMoodEl.value = entry.mood;
  dailyFocusEl.value = entry.focusMinutes ? String(entry.focusMinutes) : "";
  dailyNotesEl.value = entry.notes;

  dailyHabitsEl.innerHTML = "";
  for (const habit of DAILY_HABITS) {
    const row = document.createElement("label");
    row.className = "habit-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(entry.habits?.[habit.id]);
    checkbox.dataset.habitId = habit.id;

    const label = document.createElement("span");
    label.textContent = habit.label;

    row.appendChild(checkbox);
    row.appendChild(label);
    dailyHabitsEl.appendChild(row);
  }

  const streak = dailyStreak();
  dailyStreakEl.textContent =
    streak > 0 ? `${streak}-day streak` : "No streak yet";

  const doneHabits = DAILY_HABITS.filter(
    (habit) => entry.habits[habit.id],
  ).length;
  setDailyStatus(`${doneHabits}/${DAILY_HABITS.length} habits checked today`);
}

function persistDaily() {
  return writeStorage({ [STORAGE_KEYS.daily]: state.dailyByDate })
    .then(() => setDailyStatus("Saved", false))
    .catch(() => setDailyStatus("Could not save", true));
}

function queueDailyPersist() {
  if (dailyPersistTimer) clearTimeout(dailyPersistTimer);
  dailyPersistTimer = setTimeout(() => {
    persistDaily();
  }, 200);
}

function setAppStatus(message, isError = false) {
  appStatusEl.textContent = message;
  appStatusEl.classList.toggle("error", isError);
}

function persistAppHistory() {
  return writeStorage({ [STORAGE_KEYS.appHistory]: state.appHistory });
}

function renderAppHistory() {
  appHistoryEl.innerHTML = "";

  if (!state.appHistory.length) {
    const item = document.createElement("li");
    item.className = "history-item";
    item.textContent = "No app commands yet.";
    appHistoryEl.appendChild(item);
    return;
  }

  for (const row of state.appHistory) {
    const item = document.createElement("li");
    item.className = "history-item";

    const command = document.createElement("span");
    command.className = "history-command";
    command.textContent = row.command;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "6px";

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = new Date(row.ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const rerun = document.createElement("button");
    rerun.type = "button";
    rerun.className = "chip-btn";
    rerun.dataset.historyCommand = row.command;
    rerun.textContent = "Run";

    right.appendChild(time);
    right.appendChild(rerun);

    item.appendChild(command);
    item.appendChild(right);
    appHistoryEl.appendChild(item);
  }
}

function renderConnectors() {
  appConnectorGridEl.innerHTML = "";
  for (const connector of APP_CONNECTORS) {
    const card = document.createElement("article");
    card.className = "app-card";

    const head = document.createElement("div");
    head.className = "app-card-head";

    const label = document.createElement("span");
    label.className = "app-label";
    label.textContent = connector.name;

    const alias = document.createElement("span");
    alias.className = "app-alias";
    alias.textContent = connector.alias;

    head.appendChild(label);
    head.appendChild(alias);

    const desc = document.createElement("p");
    desc.className = "app-desc";
    desc.textContent = `${connector.description} Try: ${connector.example}`;

    const actions = document.createElement("div");
    actions.className = "app-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "chip-btn";
    openBtn.dataset.appCommand = `${connector.alias} open`;
    openBtn.textContent = "Open";

    const fillBtn = document.createElement("button");
    fillBtn.type = "button";
    fillBtn.className = "chip-btn";
    fillBtn.dataset.fillCommand = connector.example;
    fillBtn.textContent = "Use Example";

    actions.appendChild(openBtn);
    actions.appendChild(fillBtn);

    card.appendChild(head);
    card.appendChild(desc);
    card.appendChild(actions);
    appConnectorGridEl.appendChild(card);
  }
}

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function parseAppCommand(raw) {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { error: "Enter a command like wa john or gh open." };
  }

  const alias = parts[0].toLowerCase();
  const connector = APP_BY_ALIAS.get(alias);
  if (!connector) {
    return { error: `Unknown connector '${alias}'.` };
  }

  let actionKey = connector.defaultAction;
  let payloadWords = parts.slice(1);

  const candidateAction = payloadWords[0]?.toLowerCase();
  if (candidateAction && connector.actions[candidateAction]) {
    actionKey = candidateAction;
    payloadWords = payloadWords.slice(1);
  }

  const action = connector.actions[actionKey];
  const payload = payloadWords.join(" ").trim();

  if (action.requiresInput && !payload) {
    return { error: `${connector.alias} ${actionKey} needs text.` };
  }

  return {
    connector,
    actionKey,
    payload,
    url: action.build(payload),
  };
}

function runAppCommand(rawCommand) {
  const parsed = parseAppCommand(rawCommand);
  if (parsed.error) {
    setAppStatus(parsed.error, true);
    return false;
  }

  openExternal(parsed.url);

  state.appHistory.unshift({
    id: makeId(),
    command: rawCommand.trim(),
    url: parsed.url,
    ts: Date.now(),
  });
  state.appHistory = state.appHistory.slice(0, MAX_APP_HISTORY);
  renderAppHistory();
  persistAppHistory();

  setAppStatus(`Opened ${parsed.connector.name} (${parsed.actionKey})`, false);
  return true;
}

function bindEvents() {
  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });

  assistantFormEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const promptText = assistantInputEl.value.trim();
    if (!promptText) return;

    assistantInputEl.value = "";
    appendMessage("user", promptText);
    const reply = await callAssistant(promptText);
    appendMessage("assistant", reply);
  });

  clearChatBtnEl.addEventListener("click", async () => {
    state.messages = [];
    renderMessages();
    await chrome.storage.local
      .remove(STORAGE_KEYS.messages)
      .catch(() => undefined);
    appendMessage("assistant", "Chat cleared. Ready for your next prompt.");
  });

  taskFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = taskInputEl.value.trim();
    if (!title) return;

    state.tasks.unshift({
      id: makeId(),
      title,
      done: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.tasks = state.tasks.slice(0, MAX_TASKS);
    taskInputEl.value = "";
    renderTasks();
    persistTasks();
  });

  taskListEl.addEventListener("change", (event) => {
    const role = event.target?.dataset?.role;
    if (role !== "toggle") return;

    const item = event.target.closest("[data-task-id]");
    if (!item) return;

    const task = state.tasks.find((entry) => entry.id === item.dataset.taskId);
    if (!task) return;

    task.done = Boolean(event.target.checked);
    task.updatedAt = Date.now();
    renderTasks();
    persistTasks();
  });

  taskListEl.addEventListener("click", (event) => {
    const role = event.target?.dataset?.role;
    if (!role) return;

    const item = event.target.closest("[data-task-id]");
    if (!item) return;

    const idx = state.tasks.findIndex(
      (entry) => entry.id === item.dataset.taskId,
    );
    if (idx < 0) return;

    if (role === "delete") {
      state.tasks.splice(idx, 1);
      renderTasks();
      persistTasks();
      return;
    }

    if (role === "edit") {
      const current = state.tasks[idx];
      const nextTitle = window.prompt("Edit task", current.title);
      if (!nextTitle) return;
      const cleaned = nextTitle.trim();
      if (!cleaned) return;
      current.title = cleaned;
      current.updatedAt = Date.now();
      renderTasks();
      persistTasks();
    }
  });

  clearDoneBtnEl.addEventListener("click", () => {
    state.tasks = state.tasks.filter((task) => !task.done);
    renderTasks();
    persistTasks();
  });

  dailyMoodEl.addEventListener("change", () => {
    const entry = todayDailyEntry();
    entry.mood = dailyMoodEl.value;
    entry.updatedAt = Date.now();
    queueDailyPersist();
    renderDaily();
  });

  dailyFocusEl.addEventListener("input", () => {
    const entry = todayDailyEntry();
    const value = Number.parseInt(dailyFocusEl.value, 10);
    entry.focusMinutes = Number.isFinite(value) ? Math.max(0, value) : 0;
    entry.updatedAt = Date.now();
    queueDailyPersist();
    renderDaily();
  });

  dailyNotesEl.addEventListener("input", () => {
    const entry = todayDailyEntry();
    entry.notes = dailyNotesEl.value;
    entry.updatedAt = Date.now();
    queueDailyPersist();
    renderDaily();
  });

  dailyHabitsEl.addEventListener("change", (event) => {
    const habitId = event.target?.dataset?.habitId;
    if (!habitId) return;

    const entry = todayDailyEntry();
    entry.habits[habitId] = Boolean(event.target.checked);
    entry.updatedAt = Date.now();
    queueDailyPersist();
    renderDaily();
  });

  dailySaveBtnEl.addEventListener("click", () => {
    if (dailyPersistTimer) clearTimeout(dailyPersistTimer);
    persistDaily();
  });

  appCmdFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = appCmdInputEl.value.trim();
    if (!command) return;
    const ok = runAppCommand(command);
    if (ok) {
      appCmdInputEl.value = "";
    }
  });

  appConnectorGridEl.addEventListener("click", (event) => {
    const fillCommand = event.target?.dataset?.fillCommand;
    if (fillCommand) {
      appCmdInputEl.value = fillCommand;
      appCmdInputEl.focus();
      setAppStatus(`Prepared: ${fillCommand}`, false);
      return;
    }

    const appCommand = event.target?.dataset?.appCommand;
    if (appCommand) {
      runAppCommand(appCommand);
    }
  });

  appHistoryEl.addEventListener("click", (event) => {
    const command = event.target?.dataset?.historyCommand;
    if (!command) return;
    runAppCommand(command);
  });
}

async function bootstrap() {
  todayLabelEl.textContent = formatTodayLabel();
  setActiveTab(state.activeTab);

  const initial = await readStorage(Object.values(STORAGE_KEYS));
  state.messages = normalizeMessages(initial[STORAGE_KEYS.messages]);
  state.tasks = normalizeTasks(initial[STORAGE_KEYS.tasks]);
  state.dailyByDate = normalizeDaily(initial[STORAGE_KEYS.daily]);
  state.appHistory = normalizeAppHistory(initial[STORAGE_KEYS.appHistory]);

  if (!state.messages.length) {
    state.messages = [
      {
        role: "assistant",
        content:
          "Hi, I am your Navix side-panel assistant. Switch tabs for Tasks, Daily, and Apps.",
        ts: Date.now(),
      },
    ];
    persistMessages();
  }

  renderMessages();
  renderTasks();
  renderDaily();
  renderConnectors();
  renderAppHistory();
  bindEvents();
}

bootstrap();
