const chatEl = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const micBtn = document.getElementById("mic");
const hint = document.getElementById("hint");
const meta = document.getElementById("meta");

const goalInput = document.getElementById("goal");
const setGoalBtn = document.getElementById("setGoal");
const resetBtn = document.getElementById("reset");

// Set this to your deployed Worker URL after deploy.
// For local dev with wrangler dev, usually: http://127.0.0.1:8787
const WORKER_BASE = "https://cf-ai-study-sprint-coach-worker.jsompalli7.workers.dev";

let session = localStorage.getItem("session") || crypto.randomUUID();
localStorage.setItem("session", session);

function addBubble(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function callApi(payload) {
  const res = await fetch(`${WORKER_BASE}/api/chat?session=${encodeURIComponent(session)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return await res.json();
}

async function sendMessage(message) {
  addBubble("user", message);

  try {
    const data = await callApi({ message });
    meta.textContent = data.goal ? `Goal: ${data.goal}` : "Goal: (none set)";
    addBubble("assistant", data.answer);
  } catch (e) {
    addBubble("assistant", `Error: ${String(e.message || e)}`);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  await sendMessage(message);
});

setGoalBtn.addEventListener("click", async () => {
  const g = goalInput.value.trim();
  if (!g) return;
  try {
    const data = await callApi({ message: "Goal updated.", setGoal: g });
    meta.textContent = `Goal: ${data.goal}`;
    addBubble("assistant", `✅ Set sprint goal: ${data.goal}`);
  } catch (e) {
    addBubble("assistant", `Error: ${String(e.message || e)}`);
  }
});

resetBtn.addEventListener("click", async () => {
  try {
    await callApi({ message: "reset", reset: true });
    chatEl.innerHTML = "";
    meta.textContent = "Goal: (none set)";
    addBubble("assistant", "🧼 Memory cleared for this session.");
  } catch (e) {
    addBubble("assistant", `Error: ${String(e.message || e)}`);
  }
});

// Optional voice input (browser Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  micBtn.disabled = true;
  hint.textContent = "Voice input not supported in this browser.";
} else {
  const rec = new SpeechRecognition();
  rec.lang = "en-US";
  rec.interimResults = false;

  micBtn.addEventListener("click", () => {
    hint.textContent = "Listening…";
    rec.start();
  });

  rec.addEventListener("result", async (e) => {
    const transcript = e.results[0][0].transcript;
    hint.textContent = "";
    await sendMessage(transcript);
  });

  rec.addEventListener("error", () => {
    hint.textContent = "Mic error. Check permissions.";
  });

  rec.addEventListener("end", () => {
    hint.textContent = "";
  });
}
