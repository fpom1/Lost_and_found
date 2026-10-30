
"use strict";

const itemsGrid = document.getElementById("itemsGrid");
const searchForm = document.getElementById("searchForm");
const keywordInput = document.getElementById("keyword");
const categorySelect = document.getElementById("category");
const searchStatus = document.getElementById("searchStatus");
const viewAllLink = document.getElementById("viewAll");
const currentYear = document.getElementById("currentYear");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

let allItems = [];
let showingAll = false;

// Update the copyright year automatically.
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// Mobile navigation.
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Load the separate JSON data file.
async function loadItems() {
  itemsGrid.innerHTML =
    '<p class="loading-message">Loading found items...</p>';

  try {
    const response = await fetch("items.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Could not load items.json (${response.status})`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("items.json must contain a JSON array.");
    }

    allItems = data.filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        typeof item.category === "string"
    );

    populateCategories();
    renderItems(allItems);
  } catch (error) {
    console.error("Failed to load found items:", error);

    itemsGrid.innerHTML = `
      <p class="error-message">
        Unable to load found items. Make sure items.json exists
        and you're running the site through a local web server.
      </p>
    `;
  }
}

function populateCategories() {
  const categories = [
    ...new Set(
      allItems
        .map((item) => item.category.trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));

  categorySelect.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All categories";
  categorySelect.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Format dates without displaying invalid dates.
function formatDate(dateString) {
  if (!dateString) return "Date unknown";

  // Parse date-only values as local calendar dates.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  const date = match
    ? new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
    : new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

// Create an item card using DOM methods.
function createItemCard(item) {
  const article = document.createElement("article");
  article.className = "item-card";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "item-card-button";
  button.setAttribute("aria-label", `View details for ${item.name}`);

  const imageContainer = document.createElement("div");
  imageContainer.className = "item-image image-placeholder";
  imageContainer.setAttribute("role", "img");
  imageContainer.setAttribute("aria-label", item.name);

  const imageLabel = document.createElement("span");
  imageLabel.textContent = "Item photo";
  imageContainer.appendChild(imageLabel);

  if (typeof item.image === "string" && item.image.trim()) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    img.loading = "lazy";

    img.addEventListener("error", () => {
      img.remove();
      imageLabel.style.display = "";
    });

    imageLabel.style.display = "none";
    imageContainer.appendChild(img);
  }

  const details = document.createElement("div");
  details.className = "item-details";

  const name = document.createElement("h3");
  name.textContent = item.name;

  const metadata = document.createElement("p");
  metadata.textContent =
    `Found ${formatDate(item.dateFound)} · ${item.location || "Location unavailable"}`;
  metadata.title = metadata.textContent;

  const category = document.createElement("span");
  category.className = "item-category";
  category.textContent = item.category;

  details.append(name, metadata, category);
  button.append(imageContainer, details);
  article.appendChild(button);

  button.addEventListener("click", () => {
    showItemDetails(item);
  });

  return article;
}

// item's details.
function showItemDetails(item) {
  const date = formatDate(item.dateFound);
  const description = item.description || "No additional details available.";
  const location = item.location || "Location unavailable";

  const dialog = document.createElement("dialog");
  dialog.className = "item-dialog";

  const heading = document.createElement("h2");
  heading.textContent = item.name;

  const category = document.createElement("p");
  category.textContent = `Category: ${item.category}`;

  const foundDate = document.createElement("p");
  foundDate.textContent = `Date found: ${date}`;

  const foundLocation = document.createElement("p");
  foundLocation.textContent = `Location: ${location}`;

  const itemDescription = document.createElement("p");
  itemDescription.textContent = description;

  const closeButton = document.createElement("button");
  closeButton.className = "button button-dark";
  closeButton.textContent = "Close";
  closeButton.type = "button";
  closeButton.addEventListener("click", () => dialog.close());

  dialog.append(
    heading,
    category,
    foundDate,
    foundLocation,
    itemDescription,
    closeButton
  );

  document.body.appendChild(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.showModal();
}

// Render listings. newest first. four visible by default.
function renderItems(items) {
  itemsGrid.replaceChildren();

  const sortedItems = [...items].sort((a, b) => {
    const dateA = Date.parse(a.dateFound || "") || 0;
    const dateB = Date.parse(b.dateFound || "") || 0;
    return dateB - dateA;
  });

  const visibleItems = showingAll
    ? sortedItems
    : sortedItems.slice(0, 4);

  if (visibleItems.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent =
      "No found items match your search. Try another keyword or category.";
    itemsGrid.appendChild(message);
  } else {
    const fragment = document.createDocumentFragment();

    visibleItems.forEach((item) => {
      fragment.appendChild(createItemCard(item));
    });

    itemsGrid.appendChild(fragment);
  }

  searchStatus.textContent =
    `Showing ${visibleItems.length} of ${sortedItems.length} matching items.`;

  viewAllLink.hidden = sortedItems.length <= 4;

  viewAllLink.textContent = showingAll
    ? "Show recent items ↑"
    : "View all found items →";
}

// Filter by keyword and category.
function filterItems() {
  const keyword = keywordInput.value.trim().toLocaleLowerCase();
  const category = categorySelect.value;

  const filteredItems = allItems.filter((item) => {
    const searchableText = [
      item.name,
      item.category,
      item.location,
      item.description
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    const matchesKeyword = searchableText.includes(keyword);
    const matchesCategory =
      category === "all" || item.category === category;

    return matchesKeyword && matchesCategory;
  });

  renderItems(filteredItems);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  filterItems();
});

categorySelect.addEventListener("change", filterItems);

viewAllLink.addEventListener("click", (event) => {
  event.preventDefault();

  showingAll = !showingAll;
  filterItems();
});

// Initialize the page.
loadItems();
