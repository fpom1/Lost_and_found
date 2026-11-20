import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBL2X7zEf8jSZfp-HqDEfYHLk0uNoIN3wo",
  authDomain: "lostandfoundbyui.firebaseapp.com",
  projectId: "lostandfoundbyui",
  storageBucket: "lostandfoundbyui.firebasestorage.app",
  messagingSenderId: "143800285299",
  appId: "1:143800285299:web:fda665f590118a593e5206",
  measurementId: "G-Q50FBT6DZP"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
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

// Update the copyright year automatically
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// Mobile navigation
if (menuToggle && mainNav) {
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
}

// Normalize Firestore document fields for display and filtering
function normalizeItem(doc) {
  const data = doc.data();
  const timestampMs =
    data.createdAt && typeof data.createdAt.toMillis === "function"
      ? data.createdAt.toMillis()
      : 0;

  const rawTag = data.category || data.status || "Unclaimed";
  const formattedTag =
    rawTag.charAt(0).toUpperCase() + rawTag.slice(1).toLowerCase();

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "Unnamed Item",
    location: typeof data.location === "string" ? data.location : "",
    description: typeof data.description === "string" ? data.description : "",
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    category: formattedTag,
    createdAt: data.createdAt || null,
    timestampMs
  };
}

// Load found items from Firestore
async function loadItems() {
  itemsGrid.innerHTML =
    '<p class="loading-message">Loading found items...</p>';

  try {
    const q = query(collection(db, "foundItems"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    allItems = snapshot.docs.map(normalizeItem);

    populateCategories();
    renderItems(allItems);
  } catch (error) {
    console.error("Failed to load found items:", error);

    itemsGrid.innerHTML = `
      <p class="error-message">
        Unable to load found items (${error.code || "error"}): ${error.message}
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

// Format Firestore Timestamp or Date safely
function formatDate(timestamp) {
  if (!timestamp) return "Recently";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

// Create an item card using DOM methods
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

  if (item.imageUrl.trim()) {
    const img = document.createElement("img");
    img.src = item.imageUrl;
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
    `Found ${formatDate(item.createdAt)} · ${item.location || "Location unavailable"}`;
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

// Show item details modal when a card is clicked
function showItemDetails(item) {
  const date = formatDate(item.createdAt);
  const description = item.description || "No additional details available.";
  const location = item.location || "Location unavailable";

  const dialog = document.createElement("dialog");
  dialog.className = "item-dialog";

  const heading = document.createElement("h2");
  heading.textContent = item.name;

  const statusText = document.createElement("p");
  statusText.textContent = `Status: ${item.category}`;

  const foundDate = document.createElement("p");
  foundDate.textContent = `Date reported: ${date}`;

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
    statusText,
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

// Render listings (newest first, 4 visible by default)
function renderItems(items) {
  itemsGrid.replaceChildren();

  const sortedItems = [...items].sort((a, b) => b.timestampMs - a.timestampMs);

  const visibleItems = showingAll
    ? sortedItems
    : sortedItems.slice(0, 4);

  if (visibleItems.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = allItems.length === 0
      ? "No found items have been reported yet."
      : "No found items match your search. Try another keyword.";
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

// Filter by keyword and category/status
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

keywordInput.addEventListener("input", filterItems);
categorySelect.addEventListener("change", filterItems);

viewAllLink.addEventListener("click", (event) => {
  event.preventDefault();

  showingAll = !showingAll;
  filterItems();
});

// Initialize the page
loadItems();

export {}