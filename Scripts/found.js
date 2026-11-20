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
const itemCount = document.getElementById("itemCount");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

let allItems = [];

// Format Firestore timestamp into readable date
function formatDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "Recently reported";
    }
    return timestamp.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// Build a single card element safely using DOM methods
function createItemCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    if (item.imageUrl) {
        const img = document.createElement("img");
        img.className = "item-image";
        img.src = item.imageUrl;
        img.alt = item.name || "Found item photo";
        img.loading = "lazy";
        card.appendChild(img);
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "item-placeholder";
        placeholder.textContent = "No Photo Provided";
        card.appendChild(placeholder);
    }

    const details = document.createElement("div");
    details.className = "item-details";

    const meta = document.createElement("div");
    meta.className = "item-meta";

    const statusBadge = document.createElement("span");
    statusBadge.className = "item-status";
    statusBadge.textContent = item.status || "unclaimed";

    const dateSpan = document.createElement("span");
    dateSpan.className = "item-date";
    dateSpan.textContent = formatDate(item.createdAt);

    meta.append(statusBadge, dateSpan);

    const title = document.createElement("h3");
    title.textContent = item.name || "Unnamed Item";

    const location = document.createElement("p");
    location.className = "item-location";
    location.textContent = `Found at: ${item.location || "Unknown location"}`;

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = item.description || "No description provided.";

    const claimLink = document.createElement("a");
    claimLink.className = "claim-button";
    claimLink.href = `instructions.html?item=${encodeURIComponent(item.id)}`;
    claimLink.textContent = "How to Claim This Item";

    details.append(meta, title, location, description, claimLink);
    card.appendChild(details);

    return card;
}

// Filter, sort, and render cards
function renderItems() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;

    let filtered = allItems.filter((item) => {
        const name = (item.name || "").toLowerCase();
        const location = (item.location || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        return (
            name.includes(searchTerm) ||
            location.includes(searchTerm) ||
            description.includes(searchTerm)
        );
    });

    filtered.sort((a, b) => {
        if (sortBy === "name") {
            return (a.name || "").localeCompare(b.name || "");
        }
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });

    itemsGrid.innerHTML = "";

    if (filtered.length === 0) {
        itemCount.textContent = "Showing 0 items";
        const emptyBox = document.createElement("div");
        emptyBox.className = "empty-state";
        emptyBox.textContent = allItems.length === 0
            ? "No found items have been reported yet."
            : "No items matched your search.";
        itemsGrid.appendChild(emptyBox);
        return;
    }

    itemCount.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;

    const fragment = document.createDocumentFragment();
    filtered.forEach((item) => {
        fragment.appendChild(createItemCard(item));
    });
    itemsGrid.appendChild(fragment);
}

// Fetch all documents from Firestore "foundItems" collection
async function loadFoundItems() {
    try {
        const q = query(collection(db, "foundItems"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        allItems = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        renderItems();
    } catch (error) {
        console.error("Error loading found items:", error);
        itemCount.textContent = "Unable to load items";
        itemsGrid.innerHTML = "";

        const errorBox = document.createElement("div");
        errorBox.className = "empty-state error";
        errorBox.textContent = `Error loading items (${error.code || "unknown"}): ${error.message}`;
        itemsGrid.appendChild(errorBox);
    }
}

// Event listeners
searchInput.addEventListener("input", renderItems);
sortSelect.addEventListener("change", renderItems);

// Footer year & mobile menu toggle
document.getElementById("currentYear").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

// Initial fetch
loadFoundItems();

export {}