const scripturePages = [
    {
        title: "References",
        path: "/scripture/references/",
        description: "All the material referenced throughout this work.",
        type: "thoughts"
    },    
    {
        title: "Theological Essays",
        path: "/scripture/theological-essays/",
        description: "Theological essays on general topics related to Scripture.",
        type: "thoughts"
    },
    {
        title: "Romans",
        path: "/scripture/romans/",
        description: "A commentary on Romans.",
        type: "christian"
    },
    {
        title: "Galatians",
        path: "/scripture/galatians/",
        description: "A commentary on Galatians.",
        type: "christian"
    },
    {
        title: "Habakkuk",
        path: "/scripture/habakkuk/",
        description: "A commentary on Habakkuk.",
        type: "hebrew"
    },

];

const folderGridConfig = {
    maxColumns: 4,
    idealHorizontalGap: 18,
    minHorizontalGap: 12,
    cardWidth: 7 * 16,
    minCardWidth: 7 * 16,
    startY: 16,
    rowHeight: 200,
    bottomPadding: 16,
};

const folderTypeIcons = {
    thoughts: {
        symbol: "🧠",
        src: "/assets/img/thoughts.svg"
    },
    hebrew: {
        symbol: "📜",
        src: "/assets/img/hebrew.svg"
    },
    christian: {
        symbol: "✝️",
        src: "/assets/img/christian.svg"
    },
};

function getFolderIconForType(type) {
    const normalizedType = String(type || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return folderTypeIcons[normalizedType] || folderTypeIcons.default;
}

const pageTextCache = new Map();

window.addEventListener("DOMContentLoaded", () => {
    renderFolderCards();
    const searchForm = document.getElementById("scripture-search-form");
    const searchInput = document.getElementById("scripture-search-input");
    const performSearchDebounced = debounce(() => performSearch(), 180);

    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await performSearch();
    });

    searchInput.addEventListener("input", () => {
        if (!searchInput.value.trim()) {
            updateSearchStatus("Type a query.");
            clearSearchResults();
            return;
        }
        performSearchDebounced();
    });
});

function debounce(callback, delay) {
    let timer = null;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(callback, delay);
    };
}

function renderFolderCards() {
    const container = document.getElementById("scripture-folder-list");
    container.innerHTML = "";

    if (!scripturePages.length) {
        container.innerHTML = `
            <div class="folder-placeholder">
                <p>No scripture pages have been added to the search index yet.</p>
                <p>Create pages under <code>/scripture</code> and add them to the <code>scripturePages</code> list in <code>scripture.js</code>.</p>
            </div>`;
        return;
    }

    const cards = [];
    scripturePages.forEach((page) => {
        const card = document.createElement("div");
        card.className = "folder-card";
        card.setAttribute("draggable", "false");

        const icon = getFolderIconForType(page.type);
        const iconClass = `folder-icon folder-type-${String(page.type || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;
        const iconMarkup = icon.src
            ? `<img src="${icon.src}" alt="" aria-hidden="true" onerror="this.style.display='none'">`
            : `<span class="folder-icon-symbol">${icon.symbol}</span>`;

        card.innerHTML = `
            <a class="folder-link" href="${page.path}">
                <span class="${iconClass}">
                    ${iconMarkup}
                </span>
                <span class="folder-label">${page.title}</span>
            </a>`;

        container.appendChild(card);
        cards.push(card);
    });

    layoutFolderCards(container, cards);

    window.addEventListener("resize", debounce(() => layoutFolderCards(container, cards), 140));
}

function layoutFolderCards(container, cards) {
    if (!cards.length) return;

    const containerWidth = Math.max(container.clientWidth, 0);
    let columns = Math.min(folderGridConfig.maxColumns,
        Math.max(1, Math.floor((containerWidth + folderGridConfig.idealHorizontalGap) / (folderGridConfig.cardWidth + folderGridConfig.idealHorizontalGap)))
    );

    while (columns > 1) {
        const totalGapSpace = containerWidth - columns * folderGridConfig.cardWidth;
        const gap = totalGapSpace / (columns + 1);
        if (gap >= folderGridConfig.minHorizontalGap) {
            break;
        }
        columns -= 1;
    }

    let cardWidth = folderGridConfig.cardWidth;
    if (columns === 1 && containerWidth < folderGridConfig.cardWidth + 2 * folderGridConfig.minHorizontalGap) {
        cardWidth = Math.max(folderGridConfig.minCardWidth, containerWidth - 5 * folderGridConfig.minHorizontalGap);
    }

    cards.forEach((card) => {
        card.style.width = `${cardWidth}px`;
    });

    const totalGapSpace = Math.max(0, containerWidth - columns * cardWidth);
    const horizontalGap = Math.max(folderGridConfig.minHorizontalGap,
        totalGapSpace / (columns + 1)
    );

    cards.forEach((card, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const left = horizontalGap + col * (cardWidth + horizontalGap);
        const top = folderGridConfig.startY + row * folderGridConfig.rowHeight;
        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
        makeElementDraggable(card, container);
    });

    const rows = Math.ceil(cards.length / columns);
    const containerHeight = 1*(folderGridConfig.startY + rows * folderGridConfig.rowHeight + folderGridConfig.bottomPadding);
    container.style.minHeight = `${containerHeight}px`;
    container.style.height = `${containerHeight}px`;
}


function updateSearchStatus(message) {
    const status = document.getElementById("scripture-search-status");
    status.textContent = message;
}

function clearSearchResults() {
    document.getElementById("scripture-search-results").innerHTML = "";
}

async function performSearch() {
    const query = document.getElementById("scripture-search-input").value.trim();
    const resultsContainer = document.getElementById("scripture-search-results");
    resultsContainer.innerHTML = "";

    if (!query) {
        updateSearchStatus("Type a query.");
        return;
    }

    if (!scripturePages.length) {
        updateSearchStatus("No scripture pages are indexed yet. Add them to scripture.js.");
        return;
    }

    updateSearchStatus(`Searching for "${query}"...`);
    const normalizedQuery = query.toLowerCase();
    const results = [];

    for (const page of scripturePages) {
        let matched = page.title.toLowerCase().includes(normalizedQuery);
        let snippet = "";

        if (!matched && page.description) {
            matched = page.description.toLowerCase().includes(normalizedQuery);
            if (matched) snippet = page.description;
        }

        if (!matched) {
            try {
                const pageText = await fetchPageText(page.path);
                matched = pageText.includes(normalizedQuery);
                if (matched) snippet = createSearchSnippet(pageText, normalizedQuery);
            } catch (error) {
                console.warn("Could not load page for search:", page.path, error);
            }
        }

        if (matched) {
            results.push({ ...page, snippet });
        }
    }

    if (!results.length) {
        updateSearchStatus(`No matches found for "${query}".`);
        return;
    }

    updateSearchStatus(`${results.length} result${results.length === 1 ? "" : "s"} found.`);
    results.forEach((result) => {
        const resultCard = document.createElement("div");
        resultCard.className = "search-result";
        resultCard.innerHTML = `
            <a class="search-result-link" href="${result.path}">
                <span class="search-result-title">${result.title}</span>
                <p>${result.snippet || result.description || "Matched content inside the page."}</p>
            </a>`;
        resultsContainer.appendChild(resultCard);
    });
}

function getSearchableBodyText(doc) {
    if (!doc.body) return "";
    const bodyDiv = doc.body.querySelector("#body, .body");
    const root = bodyDiv || doc.body;
    return root.textContent || "";
}

async function fetchPageText(path) {
    if (pageTextCache.has(path)) {
        return pageTextCache.get(path);
    }

    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const text = getSearchableBodyText(doc);
    const normalized = text.toLowerCase();
    pageTextCache.set(path, normalized);
    return normalized;
}

function createSearchSnippet(text, query) {
    const index = text.indexOf(query);
    if (index === -1) {
        return `${text.slice(0, 160).trim()}${text.length > 160 ? "…" : ""}`;
    }
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + query.length + 80);
    const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
    return `${start > 0 ? "…" : ""}${snippet}${end < text.length ? "…" : ""}`;
}

function makeElementDraggable(element, container) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let isDragging = false;
    let moved = false;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    element.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        pointerId = event.pointerId;
        element.setPointerCapture(pointerId);
        startX = event.clientX;
        startY = event.clientY;
        originX = parseFloat(element.style.left) || element.offsetLeft;
        originY = parseFloat(element.style.top) || element.offsetTop;
        isDragging = true;
        moved = false;
        element.style.transition = "none";
    });

    element.addEventListener("pointermove", (event) => {
        if (!isDragging || event.pointerId !== pointerId) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 4) moved = true;
        const nextX = clamp(originX + deltaX, 0, container.clientWidth - element.offsetWidth);
        const nextY = clamp(originY + deltaY, 0, container.clientHeight - element.offsetHeight);
        element.style.left = `${nextX}px`;
        element.style.top = `${nextY}px`;
    });

    element.addEventListener("pointerup", (event) => {
        if (!isDragging || event.pointerId !== pointerId) return;
        isDragging = false;
        element.releasePointerCapture(pointerId);
        pointerId = null;
        element.style.transition = "";
    });

    element.addEventListener("click", (event) => {
        if (moved) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const link = element.querySelector("a.folder-link");
        if (link && event.target !== link && !link.contains(event.target)) {
            window.location.href = link.href;
        }
    });
}
