/**
 * questions.js
 * Handles the sequential terminal questions, whisper hints,
 * progress bar, and the completion popup.
 */

// ─── Questions Data ────────────────────────────────────────────────
const QUESTIONS = [
	{
		question: "Who are you?",
		whisper: "// hint: just type your name...",
	},
	{
		question: `Imagine the API suddenly changes its response schema.\nWhat exactly does the AI Agent in n8n do to understand the new schema and automatically remap the nodes?`,
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

// ─── Step Names ────────────────────────────────────────────────────
const STEP_NAMES = ["First Step", "Second Step", "Third Step", "Final Step"];

// ─── IEEE Event URL — update when the real link is ready ──────────
const IEEE_EVENT_URL = "#";

// ─── State ─────────────────────────────────────────────────────────
let currentIndex = 0;
let userName = "";
let whisperInterval = null;
let whisperTimeout = null;
let isTransitioning = false;

// ─── DOM References ────────────────────────────────────────────────
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const whisperEl = document.getElementById("whisperText");
const popupOverlay = document.getElementById("popupOverlay");
const popupMessage = document.getElementById("popupMessage");
const eventBtn = document.getElementById("eventBtn");
const overlayMsg = document.getElementById("overlayMessage");
const mainContent = document.getElementById("mainContent");

// ─── Helpers ───────────────────────────────────────────────────────

/** Fade an element OUT by swapping classes. Returns a Promise that resolves after the CSS transition. */
function fadeOut(el, fadeClass = "fade-out") {
	return new Promise((resolve) => {
		el.classList.add(fadeClass);
		setTimeout(resolve, 420); // slightly longer than the 0.4s CSS transition
	});
}

/** Fade an element IN by removing the fade class. */
function fadeIn(el, fadeClass = "fade-out") {
	el.classList.remove(fadeClass);
}

/** Show the overlay message with a given type and text, fading it in. */
function showOverlay(text, type = "") {
	overlayMsg.textContent = text;
	overlayMsg.className = "overlay-message" + (type ? " " + type : "");
	// Force a reflow so the transition fires even if the element was already "visible"
	overlayMsg.getBoundingClientRect();
	overlayMsg.classList.add("visible");
}

/** Fade out the overlay message. Returns a Promise that resolves after the fade. */
function hideOverlay() {
	return new Promise((resolve) => {
		overlayMsg.classList.remove("visible");
		setTimeout(resolve, 520); // slightly longer than the 0.5s CSS transition
	});
}

/** Sanitise user input before injecting into innerHTML. */
function escapeHtml(str) {
	const div = document.createElement("div");
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}

// ─── Whisper Cycle ─────────────────────────────────────────────────

/** Whisper cycle: appear for 2s, hide for 8s, repeat. */
function startWhispers(hint) {
	clearWhispers();
	whisperEl.textContent = hint;
	whisperEl.classList.remove("visible");

	function cycle() {
		clearTimeout(whisperTimeout);
		whisperEl.classList.add("visible");
		whisperTimeout = setTimeout(() => {
			whisperEl.classList.remove("visible");
		}, 2000);
	}

	whisperInterval = setInterval(cycle, 8000);
}

/** Stop and clear all whisper timers. */
function clearWhispers() {
	if (whisperInterval) clearInterval(whisperInterval);
	if (whisperTimeout) clearTimeout(whisperTimeout);
	whisperEl.classList.remove("visible");
}

// ─── Progress Bar ──────────────────────────────────────────────────

function updateProgressBar(index) {
	const trackable = QUESTIONS.length - 1; // first question doesn't count
	const answered = Math.max(0, index - 1);
	const pct = Math.round((answered / trackable) * 100);
	progressBar.style.width = pct + "%";
	progressLabel.textContent = pct + "%";
	progressLabel.style.color = pct > 50 ? "black" : "white";
}

// ─── Core: Show Question ───────────────────────────────────────────

/**
 * Transition sequence for each question:
 *  1. Fade OUT current content (mainContent)
 *  2. Fade IN  step label (e.g. "Second Step")  for 2 s
 *  3. Fade OUT step label
 *  4. Swap question text
 *  5. Fade IN  mainContent with the new question
 */
async function showQuestion(index) {
	const { question, whisper } = QUESTIONS[index];
	const stepLabel = STEP_NAMES[index] || "Next Step";

	isTransitioning = true;
	clearWhispers();

	// 1. Fade out main content
	await fadeOut(mainContent, "fade-out");

	// 2. Show step label
	showOverlay(stepLabel);
	await new Promise((r) => setTimeout(r, 2000)); // hold for 2 s

	// 3. Fade out step label
	await hideOverlay();

	// 4. Swap in the new question text (invisible while mainContent is faded out)
	questionText.textContent = question;
	answerInput.value = "";

	// 5. Update progress bar and fade content back in
	updateProgressBar(index);
	fadeIn(mainContent, "fade-out");
	answerInput.focus();
	startWhispers(whisper);

	isTransitioning = false;
}

// ─── Core: Completion Popup ────────────────────────────────────────

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

// ─── Event Listener: Enter key ─────────────────────────────────────

async function onEnter(e) {
	if (e.key !== "Enter" || isTransitioning) return;

	const answer = answerInput.value.trim();
	if (!answer) return;

	// Refuse purely numeric answers (e.g. "123", but "hello123" is fine)
	if (!Number.isNaN(answer)) {
		isTransitioning = true;

		// Fade out main, show error, fade back in
		await fadeOut(mainContent, "fade-out");
		showOverlay("Invalid input: numerical entries are not permitted.", "error");
		await new Promise((r) => setTimeout(r, 2000));
		await hideOverlay();
		fadeIn(mainContent, "fade-out");
		answerInput.value = "";
		answerInput.focus();

		isTransitioning = false;
		return;
	}

	// Valid answer — show processing message
	isTransitioning = true;
	await fadeOut(mainContent, "fade-out");
	showOverlay("Processing answer... please wait.", "processing");
	await new Promise((r) => setTimeout(r, 1500));
	await hideOverlay();

	// Save name from first question
	if (currentIndex === 0) {
		userName = answer;
	}

	currentIndex++;

	if (currentIndex < QUESTIONS.length) {
		// showQuestion handles fading mainContent back in
		showQuestion(currentIndex);
	} else {
		// All done — restore mainContent opacity then show popup
		fadeIn(mainContent, "fade-out");
		isTransitioning = false;
		showPopup();
	}
}

answerInput.addEventListener("keydown", onEnter);

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
	showQuestion(0);
});
