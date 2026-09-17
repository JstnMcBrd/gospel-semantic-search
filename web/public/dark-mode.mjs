const themeToggle = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") ?? "auto";

function applyTheme() {
	document.body.classList.remove("light-mode", "dark-mode");
	let themeToApply;
	if (currentTheme === "auto") {
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		themeToApply = prefersDark ? "dark" : "light";
    	} else {
		themeToApply = currentTheme;
    	}
    	document.body.classList.add(themeToApply + "-mode");
    	updateThemeIcon();
}

applyTheme();

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
    	if (currentTheme === "auto") {
		applyTheme();
    	}
});

themeToggle.addEventListener("click", () => {
    	if (currentTheme === "auto") {
		// Switch to manual mode with opposite of current
		const isCurrentlyDark = document.body.classList.contains("dark-mode");
		currentTheme = isCurrentlyDark ? "light" : "dark";
    	} else {
		// Toggle between light and dark
		currentTheme = currentTheme === "dark" ? "light" : "dark";
    	}
    	localStorage.setItem("theme", currentTheme);
    	applyTheme();
});

function updateThemeIcon() {
    	const isDark = document.body.classList.contains("dark-mode");
    	themeToggle.textContent = isDark ? "⚪" : "⚫";
}
