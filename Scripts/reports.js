import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
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

// Initialize Firebase & Firestore only
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const reportForm = document.getElementById("reportForm");
const imageInput = document.getElementById("itemImage");
const previewContainer = document.getElementById("imagePreviewContainer");
const previewImg = document.getElementById("imagePreview");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

let currentPreviewUrl = "";

// Show a local preview when the user selects an image
imageInput.addEventListener("change", () => {
    if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        currentPreviewUrl = "";
    }

    const file = imageInput.files[0];
    if (file) {
        currentPreviewUrl = URL.createObjectURL(file);
        previewImg.src = currentPreviewUrl;
        previewContainer.hidden = false;
    } else {
        previewContainer.hidden = true;
        previewImg.src = "";
    }
});

// Helper: Resize and compress image into a Base64 string for Firestore (< 1MB limit)
function compressImageToBase64(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Export as compressed JPEG data URL
                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Failed to load image for compression."));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
}

// Handle form submission
reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const location = document.getElementById("itemLocation").value.trim();
    const description = document.getElementById("itemDescription").value.trim();
    const file = imageInput.files[0];

    if (!name || !location || !description || !file) {
        setStatus("Please fill out all fields and select an image.", true);
        return;
    }

    // Lock UI during save
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    setStatus("Processing image and saving report...", false);

    try {
        // 1. Convert and compress image to Base64 string
        const imageBase64 = await compressImageToBase64(file);

        // 2. Save item metadata + Base64 image directly to Firestore
        await addDoc(collection(db, "foundItems"), {
            name: name,
            location: location,
            description: description,
            imageUrl: imageBase64, // Works seamlessly with <img src="..."> on your Found Items page
            status: "unclaimed",
            createdAt: serverTimestamp()
        });

        // 3. Reset form and notify user
        reportForm.reset();
        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = "";
        }
        previewContainer.hidden = true;
        previewImg.src = "";
        setStatus("Item reported successfully! Thank you for helping out.", false);

    } catch (error) {
        console.error("Error submitting report:", error);
        setStatus(`Error (${error.code || "unknown"}): ${error.message}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
    }
});

function setStatus(message, isError) {
    formStatus.textContent = message;
    formStatus.classList.toggle("error", isError);
}

document.getElementById("currentYear").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

export {}