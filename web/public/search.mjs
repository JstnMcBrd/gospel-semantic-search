const mainVideo = document.getElementById("main-video");
mainVideo.playbackRate = 2;

async function handleScriptures(query, limit, volumes) {
	const column = document.getElementById("scriptures-column");
	const errorElement = document.getElementById("scriptures-error");
	const loadingElement = document.getElementById("scriptures-loading");
	const resultsElement = document.getElementById("scriptures-results");
	const searchTimeElement = document.getElementById("scriptures-search-time");

	// Make column visible
	column.style.display = "";

	// Clear previous results
	errorElement.style.display = "none";
	searchTimeElement.style.display = "none";
	resultsElement.style.display = "none";

	// Build request
	const url = new URL("/api/scriptures", window.location.origin);
	url.searchParams.append("query", query);
	url.searchParams.append("limit", limit);
	if (volumes.length < 5) {
		url.searchParams.append("volumes", volumes.join(","));
	}

	// Start the timer
	loadingElement.style.display = "";
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
		errorElement.style.display = "";
		errorElement.textContent = error.message;
		return;
	} finally {
		loadingElement.style.display = "none";
	}

	// Report search time
	const endTime = Date.now();
	const searchTime = ((endTime - startTime) / 1000).toFixed(2);
	searchTimeElement.style.display = "";
	searchTimeElement.textContent = `Search completed in ${searchTime} seconds.`;

	// Display results
	resultsElement.replaceChildren();
	resultsElement.style.display = "";
	if (results && results.length > 0) {
		for (const result of results) {
			const divResult = document.createElement("div");
			divResult.className = "result";

			const h3Title = document.createElement("h3");
			h3Title.className = "title";

			const aLink = document.createElement("a");
			aLink.target = "_blank";
			aLink.href = result.url;
			aLink.textContent = result.name;

			const pText = document.createElement("p");
			pText.className = "text";
			pText.textContent = result.text;

			const pScore = document.createElement("p");
			pScore.className = "score";
			pScore.textContent = `Relevance Score: ${result.score.toFixed(2)}`;
			
			h3Title.appendChild(aLink);
			divResult.appendChild(h3Title);
			divResult.appendChild(pText);
			divResult.appendChild(pScore);
			resultsElement.appendChild(divResult);
		}
	} else {
		const noResults = document.createElement("p");
		noResults.textContent = "No scriptures found.";
		resultsElement.appendChild(noResults);
	}	
}

async function handleGenconf(query, limit, minLength) {
	const column = document.getElementById("genconf-column");
	const errorElement = document.getElementById("genconf-error");
	const loadingElement = document.getElementById("genconf-loading");
	const resultsElement = document.getElementById("genconf-results");
	const searchTimeElement = document.getElementById("genconf-search-time");

	// Make column visible
	column.style.display = "";

	// Clear previous results
	errorElement.style.display = "none";
	searchTimeElement.style.display = "none";
	resultsElement.style.display = "none";

	// Build request
	const url = new URL("/api/genconf", window.location.origin);
	url.searchParams.append("query", query);
	url.searchParams.append("limit", limit);
	url.searchParams.append("min_length", minLength);

	// Start the timer
	loadingElement.style.display = "";
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
		errorElement.style.display = "";
		errorElement.textContent = error.message;
		return;
	} finally {
		loadingElement.style.display = "none";
	}

	// Report search time
	const endTime = Date.now();
	const searchTime = ((endTime - startTime) / 1000).toFixed(2);
	searchTimeElement.style.display = "";
	searchTimeElement.textContent = `Search completed in ${searchTime} seconds.`;

	// Display results
	resultsElement.replaceChildren();
	resultsElement.style.display = "";
	if (results && results.length > 0) {
		for (const result of results) {
			const divResult = document.createElement("div");
			divResult.className = "result";

			const h3Title = document.createElement("h3");
			h3Title.className = "title";

			const aLink = document.createElement("a");
			aLink.target = "_blank";
			aLink.href = result.url;
			aLink.textContent = result.title;

			const pAuthorDate = document.createElement("p");
			pAuthorDate.className = "author-date";
			pAuthorDate.textContent = `${result.author ? `${result.author}, ` : ""}${result.date.split("T")[0]}`;

			const pText = document.createElement("p");
			pText.className = "text";
			pText.textContent = result.text;

			const pScore = document.createElement("p");
			pScore.className = "score";
			pScore.textContent = `Relevance Score: ${result.score.toFixed(2)}`;
			
			h3Title.appendChild(aLink);
			divResult.appendChild(h3Title);
			divResult.appendChild(pAuthorDate);
			divResult.appendChild(pText);
			divResult.appendChild(pScore);
			resultsElement.appendChild(divResult);
		}
	} else {
		const noResults = document.createElement("p");
		noResults.textContent = "No scriptures found.";
		resultsElement.appendChild(noResults);
	}	
}

document.getElementById("search-form").addEventListener("submit", async function(event) {
	event.preventDefault();

	const query = document.getElementById("query").value.trim();
	if (!query) {
		return;
	}
	if (query.length > 1000) {
		alert("Query cannot exceed 1000 characters.");
		return;
	}

	const scriptureLimitValue = document.getElementById("scripture-limit").value;
	const scriptureLimit = scriptureLimitValue ? parseInt(scriptureLimitValue) : 0;
	if (scriptureLimit < 1) {
		alert("Limit must be at least 1.");
		return;
	}
	if (scriptureLimit > 100) {
		alert("Limit cannot exceed 100.");
		return;
	}

	const volumes = Array.from(
		document.querySelectorAll('#scripture-volumes input[type="checkbox"]:checked'),
	).map(cb => cb.value);

	const genconfLimitValue = document.getElementById("genconf-limit").value;
	const genconfLimit = genconfLimitValue ? parseInt(genconfLimitValue) : 0;
	if (genconfLimit < 1) {
		alert("Limit must be at least 1.");
		return;
	}
	if (genconfLimit > 100) {
		alert("Limit cannot exceed 100.");
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