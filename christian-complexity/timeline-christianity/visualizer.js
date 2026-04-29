// Color mapping function
function getColor(category) {
    const colors = {
        "New Testament": "rosybrown",
        "Other": "steelblue",
        "Gnostics": "mediumseagreen",
        "Church Fathers": "indianred",
        "Apocrypha": "darkkhaki"
    };
    return colors[category] || "lightgray";
}

// Global data store
let allData = [];
let categories = [];
let furtherCategories = [];

// Load data and initialize
async function init() {
    try {
        const response = await fetch("data.json");
        allData = await response.json();

        // Extract unique categories
        categories = [...new Set(allData.map(d => d.category).filter(Boolean))];
        furtherCategories = [...new Set(allData.map(d => d["further category"]).filter(Boolean))];

        // Sort categories
        categories.sort();
        furtherCategories.sort();

        // Build filters
        buildCategoryFilter();
        buildSubcategoryFilter();
        buildYearSlider();

        // Initial render
        updateGraph();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function buildCategoryFilter() {
    const container = document.getElementById("category-filter");
    container.innerHTML = categories.map(cat => `
        <label>
            <input type="checkbox" value="${cat}" checked onchange="updateGraph()">
            ${cat}
        </label>
    `).join("");
}

function buildSubcategoryFilter() {
    const container = document.getElementById("subcategory-filter");
    container.innerHTML = furtherCategories.map(subcat => `
        <label>
            <input type="checkbox" value="${subcat}" onchange="updateGraph()">
            ${subcat}
        </label>
    `).join("");
}

function buildYearSlider() {
    const minYear = Math.min(...allData.map(d => d.early));
    const maxYear = Math.max(...allData.map(d => d.late));

    const container = document.getElementById("year-slider");
    container.innerHTML = `
        <label>From: <input type="number" id="year-min" min="${minYear}" max="${maxYear}" value="${minYear}" onchange="updateGraph()"></label>
        <label>To: <input type="number" id="year-max" min="${minYear}" max="${maxYear}" value="${maxYear}" onchange="updateGraph()"></label>
    `;
}

function getSelectedCategories() {
    const checkboxes = document.querySelectorAll("#category-filter input:checked");
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedSubcategories() {
    const checkboxes = document.querySelectorAll("#subcategory-filter input:checked");
    return Array.from(checkboxes).map(cb => cb.value);
}

function getYearRange() {
    const min = parseInt(document.getElementById("year-min").value);
    const max = parseInt(document.getElementById("year-max").value);
    return [min, max];
}

function updateGraph() {
    const selectedCategories = getSelectedCategories();
    const selectedSubcategories = getSelectedSubcategories();
    const yearRange = getYearRange();

    // Filter data
    const filtered = allData.filter(row => {
        if (row.early > yearRange[1] || row.late < yearRange[0]) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(row.category)) return false;
        if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(row["further category"])) return false;
        return true;
    });

    // Build traces for timeline
    const traces = filtered.map(row => {
        const color = getColor(row.category);
        const customLink = row.link !== "Filler" ? row.link : "";
        
        const hover = row.early === row.late 
            ? `${row.source} (${row.early})`
            : `${row.source} (${row.early}-${row.late})`;

        const xVals = row.early === row.late 
            ? [row.early, row.late + 0.5] 
            : [row.early, row.late];

        return {
            x: xVals,
            y: [row.source, row.source],
            mode: "lines",
            line: { width: 4, color: color, shape: "spline" },
            hovertext: hover,
            hoverinfo: "text",
            name: row.source,
            customdata: [customLink, customLink],
            type: "scatter"
        };
    });

    const layout = {
        height: 900,
        margin: { l: 200 },
        xaxis: { 
            title: { 
                text: "Year",
                font: { size: 20, weight: "bold" }
            },
            tickfont: { size: 20 }
        },
        yaxis: { 
            tickfont: { size: 14 }
        },
        plot_bgcolor: "#f5e5c6",
        paper_bgcolor: "#f5e5c6",
        font: {
            family: "Crimson Text, Georgia, serif",
            color: "#000000"
        },
        showlegend: false,
        hovermode: "closest"
    };

    Plotly.newPlot("timeline-graph", traces, layout, { responsive: true });

    // Add click handler for links
    document.getElementById("timeline-graph").on("plotly_click", function(data) {
        if (data.points && data.points[0]) {
            const link = data.points[0].customdata;
            if (link) {
                window.open(link, "_blank");
            }
        }
    });
}

// Initialize on page load
init();