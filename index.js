globalThis.addEventListener("DOMContentLoaded", () => {
	setInterval(createBinary, 50);
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
	binary.style.animationDuration = 1 + Math.random() * 2 + "s";
	document.body.appendChild(binary);

	setTimeout(() => {
		binary.remove();
	}, 7000);
}
