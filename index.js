let binaryInterval;
globalThis.stopBinary = () => {
	if (binaryInterval) clearInterval(binaryInterval);
};
globalThis.addEventListener("DOMContentLoaded", () => {
	/* MORE DENSITY + SPEED */
	binaryInterval = setInterval(createBinary, 30);

	const payBtn = document.getElementById("payBtn");
	const screen = document.querySelector(".screen");

	if (payBtn && screen) {
		// To prevent multiple event listeners or jumpiness, make sure position is absolute
		// once the button is hovered the first time.
		payBtn.addEventListener("mouseover", () => {
			const screenRect = screen.getBoundingClientRect();
			const btnRect = payBtn.getBoundingClientRect();

			const maxX = screenRect.width - btnRect.width - 20; // adding a little padding
			const maxY = screenRect.height - btnRect.height - 20;

			const randomX = Math.max(10, Math.random() * maxX);
			const randomY = Math.max(10, Math.random() * maxY);

			payBtn.style.position = "absolute";
			payBtn.style.left = `${randomX}px`;
			payBtn.style.top = `${randomY}px`;
		});
	}
});
function createBinary() {
	const binary = document.createElement("div");
	binary.classList.add("binary");

	let text = "";
	for (let i = 0; i < 30; i++) {
		text += Math.random() > 0.5 ? "1" : "0";
	}

	binary.innerText = text;
	binary.style.left = Math.random() * 100 + "vw";
	/* SPEED INCREASED */
	binary.style.animationDuration = 0.5 + Math.random() * 1 + "s";

	document.body.appendChild(binary);

	setTimeout(() => {
		binary.remove();
	}, 3000);
}
