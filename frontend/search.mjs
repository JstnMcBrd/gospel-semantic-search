const mainVideo = document.getElementById("main-video");
mainVideo.playbackRate = 2;

async function handleScriptures(query, limit, volumes) {
	const column = document.getElementById("scriptures-column");
	const errorElement = document.getElementById("scriptures-error");
	const loadingElement = document.getElementById("scriptures-loading");
	const resultsElement = document.getElementById("scriptures-results");
	const searchTimeElement = document.getElementById("scriptures-search-time");
	const resultListElement = document.getElementById("scriptures-list");

	column.style.display = "block";

	// Clear previous results
	errorElement.style.display = "none";
	searchTimeElement.textContent = "";
	resultsElement.style.display = "none";

	// Build request
	const url = new URL("http://localhost:5000/scriptures");
	url.searchParams.append("query", query);
	url.searchParams.append("limit", limit);
	if (volumes.length < 5) {
		url.searchParams.append("volumes", volumes.join(","));
	}

	// Start the timer
	loadingElement.style.display = "block";
	const startTime = Date.now();

	// Retrieve results / error handling
	let results;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(`API Error ${response.status}: ${text}`);
		}
		const json = await response.json();
		results = json.results;
	} catch (error) {
		console.error(error);
		errorElement.style.display = "block";
		errorElement.textContent = error.message;
		return;
	} finally {
		loadingElement.style.display = "none";
	}

	// Report search time
	const endTime = Date.now();
	const searchTime = ((endTime - startTime) / 1000).toFixed(2);
	searchTimeElement.textContent = `Search completed in ${searchTime} seconds.`;

	// Display results
	resultsElement.style.display = "block";
	resultListElement.innerHTML = "";
	if (results && results.length > 0) {
		for (const result of results) {
			const div = document.createElement("div");
			div.className = "result";
			div.innerHTML = `
				<h3 class="title">
					<a target="_blank" href="${result.url}">
						${result.name}
					</a>
				</h3>
				<p class="text">${result.text}</p>
				<p class="score">Relevance Score: ${result.score.toFixed(2)}</p>
			`;
			resultListElement.appendChild(div);
		}
	} else {
		resultListElement.innerHTML = "<p>No scriptures found.</p>";
	}	
}

async function handleGenconf(query, limit, minLength) {
	const column = document.getElementById("genconf-column");
	const errorElement = document.getElementById("genconf-error");
	const loadingElement = document.getElementById("genconf-loading");
	const resultsElement = document.getElementById("genconf-results");
	const searchTimeElement = document.getElementById("genconf-search-time");
	const resultListElement = document.getElementById("genconf-list");

	column.style.display = "block";

	// Clear previous results
	errorElement.style.display = "none";
	searchTimeElement.textContent = "";
	resultsElement.style.display = "none";

	// Build request
	const url = new URL("http://localhost:5000/genconf");
	url.searchParams.append("query", query);
	url.searchParams.append("limit", limit);
	url.searchParams.append("min_length", minLength);

	// Start the timer
	loadingElement.style.display = "block";
	const startTime = Date.now();

	// Retrieve results / error handling
	let results;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(`API Error ${response.status}: ${text}`);
		}
		const json = await response.json();
		results = json.results;
	} catch (error) {
		console.error(error);
		errorElement.style.display = "block";
		errorElement.textContent = error.message;
		return;
	} finally {
		loadingElement.style.display = "none";
	}

	// Report search time
	const endTime = Date.now();
	const searchTime = ((endTime - startTime) / 1000).toFixed(2);
	searchTimeElement.textContent = `Search completed in ${searchTime} seconds.`;

	// Display results
	resultsElement.style.display = "block";
	resultListElement.innerHTML = "";
	if (results && results.length > 0) {
		for (const result of results) {
			const div = document.createElement("div");
			div.className = "result";
			div.innerHTML = `
				<h3 class="title">
					<a target="_blank" href="${result.url}">
						${result.title}
					</a>
				</h3>
				<p class="author-date">
					${result.author ? `${result.author}, ` : ""}${result.date.split("T")[0]}
				</p>
				<p class="text">${result.text}</p>
				<p class="score">Relevance Score: ${result.score.toFixed(2)}</p>
			`;
			resultListElement.appendChild(div);
		}
	} else {
		resultListElement.innerHTML = "<p>No scriptures found.</p>";
	}	
}

document.getElementById("search-form").addEventListener("submit", async function(event) {
	event.preventDefault();

	const query = document.getElementById("query").value.trim();
	if (!query) {
		return;
	}

	const scriptureLimitValue = document.getElementById("scripture-limit").value;
	const scriptureLimit = scriptureLimitValue ? parseInt(scriptureLimitValue) : 0;
	if (scriptureLimit < 1) {
		alert("Limit must be at least 1.");
		return;
	}

	const volumes = Array.from(
		document.querySelectorAll('#advanced-options input[type="checkbox"]:checked'),
	).map(cb => cb.value);

	const genconfLimitValue = document.getElementById("genconf-limit").value;
	const genconfLimit = genconfLimitValue ? parseInt(genconfLimitValue) : 0;
	if (genconfLimit < 1) {
		alert("Limit must be at least 1.");
		return;
	}

	const minLengthValue = document.getElementById("min-length").value;
	const minLength = minLengthValue ? parseInt(minLengthValue) : 0;
	if (minLength < 0) {
		alert("Minimum length cannot be negative.");
		return;
	}
	
	mainVideo.currentTime = 0;
	mainVideo.play();

	try {
		await Promise.all([
			handleScriptures(query, scriptureLimit, volumes),
			handleGenconf(query, genconfLimit, minLength),
		]);
	} catch (error) {
		console.error("Error during search:", error);
	}
});