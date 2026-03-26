let currentDir = "/";

const output = document.getElementById("term");

const capture = document.createElement("input");
capture.className = "hidden-capture";
capture.autocomplete = "off";
capture.spellcheck = false;
document.body.appendChild(capture);

let currentCommand = "";
let activeRow = null;

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function normalizePath(path) {
  if (!path || path === "/") return "/";
  if (!path.startsWith("/")) path = "/" + path;
  if (!path.endsWith("/")) path += "/";
  return path;
}

function parentDir(path) {
  path = normalizePath(path);
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? "/" + parts.join("/") + "/" : "/";
}

function makePromptHTML() {
  return `${nowTime()} <span style="color: lightgreen;">cat</span>@<span style="color: cyan;">zero</span>:<span style="color: yellow;">${currentDir}</span> `;
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
}

function updateCurrentLine() {
  if (!activeRow) return;
  const cmdSpan = activeRow.querySelector(".cmd-text");
  const cursor = activeRow.querySelector(".cursor");
  cmdSpan.textContent = currentCommand;
  if (cursor) cursor.style.display = "inline-block";
}

function printLine(text) {
  const line = document.createElement("div");
  line.innerHTML = text;
  output.appendChild(line);
}

async function readList(dir) {
  const cleanDir = normalizePath(dir);
  const url = cleanDir === "/" ? "/list.json" : `${cleanDir}list.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return await res.json();
}

function formatLsData(data) {
  if (Array.isArray(data)) {
    if (typeof data[0] === "string" || data.length === 0) return data.join("  ");
    return data.map(item => item.type === "dir" ? `${item.name}/` : item.name).join("  ");
  }
  return String(data);
}

async function runCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1];

  if (!cmd) return;

  if (cmd === "ls") {
    try {
      const data = await readList(currentDir);
      printLine(formatLsData(data));
    } catch (err) {
      printLine(`<span style="color:red;">${err.message}</span>`);
    }
    return;
  }

  if (cmd === "cd") {
    if (!arg || arg === "~" || arg === "/") {
      currentDir = "/";
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
        printLine(`<span style="color:red;">cd: no such directory: ${arg}</span>`);
        return;
      }

      if (target.type !== "dir") {
        printLine(`<span style="color:red;">cd: not a directory: ${arg}</span>`);
        return;
      }

      currentDir = normalizePath(currentDir === "/" ? `/${target.name}` : `${currentDir}${target.name}`);
    } catch (err) {
      printLine(`<span style="color:red;">${err.message}</span>`);
    }
    return;
  }

  printLine(`<span style="color:red;">command not found: ${cmd}</span>`);
}

capture.addEventListener("input", () => {
  currentCommand = capture.value;
  updateCurrentLine();
});

capture.addEventListener("keydown", async (e) => {
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