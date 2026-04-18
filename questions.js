/**
 * questions.js
 * Handles the sequential terminal questions, whisper hints,
 * progress bar, and the completion popup.
 */

// ─── Questions Data ────────────────────────────────────────────────
// Each entry: { question, whisper }
// Fill in your own questions and whispers for entries 2-4.
const QUESTIONS = [
	{
		question: "Who are you?",
		whisper: "// hint: just type your name...",
	},
	{
		question: `Imagine the API suddenly changes its response schema.
What exactly does the AI Agent in n8n do to understand the new schema and automatically remap the nodes?`,
		whisper: "// hint: search about n8n or just ask chatgpt",
	},
	{
		question: `What is the key new capability in Claude 4.6 that sets it apart from other state-of-the-art chatbots, particularly in complex and long-context tasks?`,
		whisper: "// hint: claude 4.6 or just ask chatgpt",
	},
	{
		question: `What is the main difference between traditional signature-based detection and AI-powered UEBA that monitors user and device behavior?`,
		whisper: "// hint: UEBA or just ask chatgpt",
	},
];

// IEEE event link — update this when you have the real URL
const IEEE_EVENT_URL = "#";

// ─── State ─────────────────────────────────────────────────────────
let currentIndex = 0;
let userName = "";
let whisperInterval = null;
let whisperTimeout = null;

// ─── DOM References ────────────────────────────────────────────────
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const whisperEl = document.getElementById("whisperText");
const popupOverlay = document.getElementById("popupOverlay");
const popupMessage = document.getElementById("popupMessage");
const eventBtn = document.getElementById("eventBtn");

// ─── Core Functions ────────────────────────────────────────────────

/** Render the question at `index` and reset all timers. */
function showQuestion(index) {
	const { question, whisper } = QUESTIONS[index];

	// Update question text (faded type-in feel via quick swap)
	questionText.style.opacity = "0";
	setTimeout(() => {
		questionText.textContent = question;
		questionText.style.transition = "opacity 0.4s ease";
		questionText.style.opacity = "1";
	}, 150);

	// Clear & reset user input
	answerInput.value = "";
	answerInput.focus();

	// Update progress bar.
	// The first question (index 0) is the name question and does NOT count.
	// We only track progress through the remaining 3 questions (indices 1-3).
	const trackable = QUESTIONS.length - 1; // 3
	const answered = Math.max(0, index - 1); // how many of the 3 have been answered
	const pct = Math.round((answered / trackable) * 100);
	progressBar.style.width = pct + "%";
	progressLabel.textContent = pct + "%";
	progressLabel.style.color = pct > 50 ? "black" : "white";

	// Start whisper cycle for this question
	startWhispers(whisper);
}

/** Whisper cycle: appear for 3s, hide for 10s, repeat. */
function startWhispers(hint) {
	clearWhispers(); // clear previous question's timers

	whisperEl.textContent = hint;
	whisperEl.classList.remove("visible");

	// First whisper appears after 10 seconds
	function cycle() {
		if (whisperTimeout) clearTimeout(whisperTimeout);
		whisperEl.classList.add("visible");
		whisperTimeout = setTimeout(() => {
			whisperEl.classList.remove("visible");
		}, 2000); // visible for 3s
	}

	// Start the interval: every 13s (10s wait + 3s visible)
	whisperInterval = setInterval(cycle, 8000);
}

/** Stop and clear all whisper timers. */
function clearWhispers() {
	if (whisperInterval) clearInterval(whisperInterval);
	if (whisperTimeout) clearTimeout(whisperTimeout);
	whisperEl.classList.remove("visible");
}

/** Show the final popup after all questions are answered. */
function showPopup() {
	clearWhispers();
	answerInput.removeEventListener("keydown", onEnter);
	globalThis.stopBinary?.();

	// Fill progress bar to 100%
	progressBar.style.width = "100%";
	progressLabel.textContent = "100%";
	progressLabel.style.color = "black";

	// Update the IEEE button link
	eventBtn.href = IEEE_EVENT_URL;

	// Personalised message
	popupMessage.innerHTML = `
		Good news, <span class="name-highlight">${escapeHtml(userName)}</span>! 
		Your data has been returned to normal and no harm was done to your device 
		this time. But please be careful — the next time you click a random link 
		from the internet, the hacker might really hurt your device and steal your 
		personal data if you keep yourself open and unguarded.
	`;

	popupOverlay.classList.add("active");
}

/** Sanitise user input before injecting into innerHTML. */
function escapeHtml(str) {
	const div = document.createElement("div");
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}

// ─── Event Listener: Enter key to submit answer ───────────────────
function onEnter(e) {
	if (e.key !== "Enter") return;

	const answer = answerInput.value.trim();
	if (!answer) return; // don't advance on empty input

	// Save the first answer as the user's name
	if (currentIndex === 0) {
		userName = answer;
	}

	currentIndex++;

	if (currentIndex < QUESTIONS.length) {
		showQuestion(currentIndex);
	} else {
		showPopup();
	}
}
answerInput.addEventListener("keydown", onEnter);

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
	showQuestion(0);
});
