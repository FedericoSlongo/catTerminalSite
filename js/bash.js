let currentDir = ""; // root of the site, not "/"

const output = document.getElementById("term");

const capture = document.createElement("input");
capture.className = "hidden-capture";
capture.autocomplete = "off";
capture.spellcheck = false;
document.body.appendChild(capture);

let currentCommand = "";
let activeRow = null;

function scrollToBottom() {
  requestAnimationFrame(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function normalizePath(path) {
  if (!path || path === "/" || path === "./") return "";
  path = String(path).replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (path && !path.endsWith("/")) path += "/";
  return path;
}

function parentDir(path) {
  path = normalizePath(path);
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? parts.join("/") + "/" : "";
}

function makePromptHTML() {
  const displayDir = "/" + currentDir;
  return `${nowTime()} <span style="color: lightgreen;">cat</span>@<span style="color: cyan;">zero</span>:<span style="color: yellow;">${displayDir}</span> `;
}

function renderPrompt() {
  activeRow = document.createElement("div");
  activeRow.className = "terminal-line";

  const prompt = document.createElement("span");
  prompt.className = "prompt";
  prompt.innerHTML = makePromptHTML();

  const cmd = document.createElement("span");
  cmd.className = "cmd-text";

  const cursor = document.createElement("span");
  cursor.className = "cursor";

  activeRow.appendChild(prompt);
  activeRow.appendChild(cmd);
  activeRow.appendChild(cursor);
  output.appendChild(activeRow);

  currentCommand = "";
  capture.value = "";
  capture.focus();
  scrollToBottom();
}

function updateCurrentLine() {
  if (!activeRow) return;
  const cmdSpan = activeRow.querySelector(".cmd-text");
  if (cmdSpan) cmdSpan.textContent = currentCommand;
}

function printLine(text) {
  const line = document.createElement("div");
  line.textContent = text;
  output.appendChild(line);
  scrollToBottom();
}

function printHTMLLine(html) {
  const line = document.createElement("div");
  line.innerHTML = html;
  output.appendChild(line);
  scrollToBottom();
}

function printHTMLContent(html) {
  const container = document.createElement("div");
  container.style.whiteSpace = "pre-wrap";

  let sanitized = html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  sanitized = sanitized
    .replace(/&lt;(\/?b)&gt;/gi, "<$1>")
    .replace(/&lt;(\/?p)(\s+id\s*=\s*"[^"]*")?&gt;/gi, "<$1$2>")
    .replace(/&lt;(\/?span)(\s+id\s*=\s*"[^"]*")?&gt;/gi, "<$1$2>")
    .replace(/&lt;(\/?h1)(\s+id\s*=\s*"[^"]*")?&gt;/gi, "<$1$2>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
    .replace(/&lt;a\s+href\s*=\s*"([^"]*)"&gt;/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">')
    .replace(/&lt;\/a&gt;/gi, "</a>")
    .replace(/&lt;img\s+src\s*=\s*"([^"]*)"(\s*\/?)&gt;/gi, '<img src="$1">');

  container.innerHTML = sanitized;
  output.appendChild(container);
  scrollToBottom();
}

async function readList(dir) {
  const cleanDir = normalizePath(dir);
  const url = cleanDir ? `./${cleanDir}list.json` : "./list.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return await res.json();
}

function formatLsData(data) {
  if (Array.isArray(data)) {
    if (typeof data[0] === "string" || data.length === 0) return data.join("  ");
    return data
      .map(item => item.type === "dir" ? `${item.name}/` : item.name)
      .join("  ");
  }
  return String(data);
}

function resolveFilePath(fileName) {
  if (!fileName) return null;

  const cleanName = String(fileName).replace(/^\.\/+/, "").replace(/^\/+/, "");

  if (fileName.startsWith("/")) {
    return `./${cleanName}`;
  }

  return currentDir ? `./${currentDir}${cleanName}` : `./${cleanName}`;
}

async function readTextFile(fileName) {
  const filePath = resolveFilePath(fileName);
  const res = await fetch(filePath);
  if (!res.ok) throw new Error(`cat: ${fileName}: No such file`);
  return await res.text();
}

const knownCommands = ["ls", "cd", "cat", "clear"];

function commonPrefix(values) {
  if (!values.length) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

async function getCurrentDirEntries() {
  try {
    const data = await readList(currentDir);

    if (!Array.isArray(data)) return [];

    if (typeof data[0] === "string") {
      return data.map(name => ({
        name: name.replace(/\/$/, ""),
        type: name.endsWith("/") ? "dir" : "file"
      }));
    }

    return data.map(item => ({
      name: String(item.name || "").replace(/\/$/, ""),
      type: item.type || (String(item.name || "").endsWith("/") ? "dir" : "file")
    }));
  } catch {
    return [];
  }
}

async function autoComplete() {
  const text = currentCommand;
  const lastSpace = text.lastIndexOf(" ");
  const before = lastSpace === -1 ? "" : text.slice(0, lastSpace + 1);
  const token = lastSpace === -1 ? text : text.slice(lastSpace + 1);

  if (!token) return;

  const entries = await getCurrentDirEntries();
  const entryNames = entries.map(e => e.name);

  let candidates = [];
  if (lastSpace === -1) {
    candidates = [...knownCommands, ...entryNames];
  } else {
    candidates = entryNames;
  }

  const matches = candidates.filter(item => item.startsWith(token));
  if (!matches.length) return;

  const filled = commonPrefix(matches);
  if (!filled || filled === token) return;

  currentCommand = before + filled;
  capture.value = currentCommand;
  updateCurrentLine();
}

async function runCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1];

  if (!cmd) return;

  if (cmd === "clear") {
    output.innerHTML = "";
    renderPrompt();
    return;
  }

  if (cmd === "ls") {
    try {
      const data = await readList(currentDir);
      printLine(formatLsData(data));
    } catch (err) {
      printHTMLLine(`<span style="color:red;">${err.message}</span>`);
    }
    return;
  }

  if (cmd === "cd") {
    if (!arg || arg === "~" || arg === "/") {
      currentDir = "";
      return;
    }

    if (arg === "..") {
      currentDir = parentDir(currentDir);
      return;
    }

    try {
      const data = await readList(currentDir);

      let entries = [];
      if (Array.isArray(data) && typeof data[0] === "string") {
        entries = data.map(name => ({
          name,
          type: name.endsWith("/") ? "dir" : "file"
        }));
      } else if (Array.isArray(data)) {
        entries = data;
      }

      const target = entries.find(item => item.name === arg || item.name === `${arg}/`);

      if (!target) {
        printHTMLLine(`<span style="color:red;">cd: no such directory: ${arg}</span>`);
        return;
      }

      if (target.type !== "dir") {
        printHTMLLine(`<span style="color:red;">cd: not a directory: ${arg}</span>`);
        return;
      }

      currentDir = normalizePath(currentDir + target.name);
    } catch (err) {
      printHTMLLine(`<span style="color:red;">${err.message}</span>`);
    }
    return;
  }

  if (cmd === "cat") {
    if (!arg) {
      printHTMLLine(`<span style="color:red;">cat: missing file operand</span>`);
      return;
    }

    try {
      const text = await readTextFile(arg);
      printHTMLContent(text);
    } catch (err) {
      printHTMLLine(`<span style="color:red;">${err.message}</span>`);
    }
    return;
  }

  printHTMLLine(`<span style="color:red;">command not found: ${cmd}</span>`);
}

capture.addEventListener("input", () => {
  currentCommand = capture.value;
  updateCurrentLine();
});

capture.addEventListener("keydown", async (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    await autoComplete();
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();

    const entered = currentCommand;
    const cmdSpan = activeRow.querySelector(".cmd-text");
    const cursor = activeRow.querySelector(".cursor");

    if (cursor) cursor.remove();
    cmdSpan.textContent = entered;
    output.appendChild(document.createElement("br"));

    await runCommand(entered);
    renderPrompt();
  }
});

document.addEventListener("click", () => capture.focus());
window.addEventListener("keydown", () => capture.focus());

window.printPrompt = function () {
  renderPrompt();
};