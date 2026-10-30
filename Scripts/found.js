const itemsGrid = document.getElementById("itemsGrid");
const itemCount = document.getElementById("itemCount");
const pagination = document.getElementById("pagination");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const locationFilter = document.getElementById("locationFilter");
const dateAfter = document.getElementById("dateAfter");
const dateBefore = document.getElementById("dateBefore");
const categoryFilters = document.getElementById("categoryFilters");

let allItems = [];
let filteredItems = [];
let currentPage = 1;

const itemsPerPage = 6;

// Update the copyright year automatically.
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// Load data from items.json
async function loadItems() {
    try {
        const response = await fetch("items.json");

        if (!response.ok) {
            throw new Error("Could not load items.json");
        }

        const data = await response.json();

        allItems = Array.isArray(data) ? data : data.items;

        if (!Array.isArray(allItems)) {
            throw new Error("Invalid items.json format");
        }

        setupFilters();
        applyFilters();

    } catch (error) {
        console.error(error);
        itemCount.textContent = "Unable to load found items.";
    }
}

// Set up category and location filters
function setupFilters() {
    const categories = [...new Set(
        allItems.map(item => item.category).filter(Boolean)
    )].sort();

    categories.forEach(category => {
        const label = document.createElement("label");
        label.className = "category-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category;
        checkbox.name = "category";

        label.append(
            checkbox,
            document.createTextNode(category)
        );

        categoryFilters.appendChild(label);
    });

    const locations = [...new Set(
        allItems.map(item => item.location).filter(Boolean)
    )].sort();

    locations.forEach(location => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Apply search, filters and sorting
function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();

    const selectedCategories = [
        ...categoryFilters.querySelectorAll("input:checked")
    ].map(checkbox => checkbox.value);

    filteredItems = allItems.filter(item => {
        const name = String(item.name || "");
        const location = String(item.location || "");
        const category = String(item.category || "");
        const date = String(item.dateFound || "");

        const matchesSearch =
            name.toLowerCase().includes(search) ||
            location.toLowerCase().includes(search) ||
            category.toLowerCase().includes(search);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(category);

        const matchesLocation =
            !locationFilter.value ||
            location === locationFilter.value;

        const matchesAfter =
            !dateAfter.value ||
            date >= dateAfter.value;

        const matchesBefore =
            !dateBefore.value ||
            date <= dateBefore.value;

        return matchesSearch &&
            matchesCategory &&
            matchesLocation &&
            matchesAfter &&
            matchesBefore;
    });

    switch (sortSelect.value) {
        case "newest":
            filteredItems.sort((a, b) =>
                String(b.dateFound || "").localeCompare(
                    String(a.dateFound || "")
                )
            );
            break;

        case "oldest":
            filteredItems.sort((a, b) =>
                String(a.dateFound || "").localeCompare(
                    String(b.dateFound || "")
                )
            );
            break;

        case "az":
            filteredItems.sort((a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
            );
            break;

        case "za":
            filteredItems.sort((a, b) =>
                String(b.name || "").localeCompare(
                    String(a.name || "")
                )
            );
            break;
    }

    currentPage = 1;
    displayItems();
}

// Create item cards
function displayItems() {
    itemsGrid.innerHTML = "";

    itemCount.textContent =
        `Showing ${filteredItems.length} items`;

    const start = (currentPage - 1) * itemsPerPage;

    const pageItems = filteredItems.slice(
        start,
        start + itemsPerPage
    );

    if (pageItems.length === 0) {
        itemsGrid.textContent = "No matching items found.";
    }

    pageItems.forEach(item => {
        const card = document.createElement("article");
        card.className = "item-card";

        // Image
        if (item.image) {
            const image = document.createElement("img");
            image.className = "item-image";
            image.src = item.image;
            image.alt = item.name || "Found item";
            image.loading = "lazy";

            image.onerror = () => {
                const placeholder = document.createElement("div");
                placeholder.className =
                    "item-image item-placeholder";
                placeholder.textContent = "Item photo";
                image.replaceWith(placeholder);
            };

            card.appendChild(image);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className =
                "item-image item-placeholder";
            placeholder.textContent = "Item photo";
            card.appendChild(placeholder);
        }

        // Item details
        const details = document.createElement("div");
        details.className = "item-details";

        const category = document.createElement("span");
        category.className = "item-category";
        category.textContent = item.category || "Other";

        const name = document.createElement("h3");
        name.textContent = item.name || "Unnamed item";

        const date = document.createElement("p");
        date.textContent =
            `Found: ${item.dateFound || "Unknown"}`;

        const location = document.createElement("p");
        location.textContent =
            `Where: ${item.location || "Unknown"}`;

        const id = document.createElement("p");
        id.textContent = `ID: #${item.id ?? "N/A"}`;

        const claim = document.createElement("a");
        claim.className = "claim-button";
        claim.href =
            `instructions.html?item=${encodeURIComponent(item.id ?? "")}`;
        claim.textContent = "Claim this item";

        details.append(
            category,
            name,
            date,
            location,
            id,
            claim
        );

        card.appendChild(details);
        itemsGrid.appendChild(card);
    });

    displayPagination();
}

// Page buttons
function displayPagination() {
    pagination.innerHTML = "";

    const totalPages = Math.ceil(
        filteredItems.length / itemsPerPage
    );

    if (totalPages <= 1) return;

    function addButton(text, page, disabled = false) {
        const button = document.createElement("button");

        button.textContent = text;
        button.disabled = disabled;

        if (page === currentPage && !disabled) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            currentPage = page;
            displayItems();
        });

        pagination.appendChild(button);
    }

    addButton("<", currentPage - 1, currentPage === 1);

    for (let page = 1; page <= totalPages; page++) {
        addButton(page, page);
    }

    addButton(
        ">",
        currentPage + 1,
        currentPage === totalPages
    );
}

// Event listeners
document.getElementById("applyFilters")
    .addEventListener("click", applyFilters);

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);

document.getElementById("clearFilters")
    .addEventListener("click", () => {
        searchInput.value = "";
        locationFilter.value = "";
        dateAfter.value = "";
        dateBefore.value = "";
        sortSelect.value = "newest";

        categoryFilters.querySelectorAll("input")
            .forEach(checkbox => {
                checkbox.checked = false;
            });

        applyFilters();
    });

// Start
loadItems();