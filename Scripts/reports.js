import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBL2X7zEf8jSZfp-HqDEfYHLk0uNoIN3wo",
    authDomain: "lostandfoundbyui.firebaseapp.com",
    projectId: "lostandfoundbyui",
    storageBucket: "lostandfoundbyui.firebasestorage.app",
    messagingSenderId: "143800285299",
    appId: "1:143800285299:web:fda665f590118a593e5206",
    measurementId: "G-Q50FBT6DZP"
  };

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const reportForm = document.getElementById("reportForm");
const imageInput = document.getElementById("itemImage");
const previewContainer = document.getElementById("imagePreviewContainer");
const previewImg = document.getElementById("imagePreview");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

// Show a local preview when the user selects an image
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
        previewImg.src = URL.createObjectURL(file);
        previewContainer.hidden = false;
    } else {
        previewContainer.hidden = true;
        previewImg.src = "";
    }
});

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

    // Lock UI during upload
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    setStatus("Uploading image and saving report...", false);

    try {
        // 1. Upload image to Firebase Storage
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `found-items/${uniqueFileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // 2. Save item metadata + image URL to Firestore
        await addDoc(collection(db, "foundItems"), {
            name: name,
            location: location,
            description: description,
            imageUrl: imageUrl,
            status: "unclaimed", // Ready for your future claim page
            createdAt: serverTimestamp()
        });

        // 3. Reset form and notify user
        reportForm.reset();
        previewContainer.hidden = true;
        previewImg.src = "";
        setStatus("Item reported successfully! Thank you for helping out.", false);

    } catch (error) {
        console.error("Error submitting report:", error);
        setStatus("Failed to submit report. Please try again.", true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
    }
});

function setStatus(message, isError) {
    formStatus.textContent = message;
    formStatus.classList.toggle("error", isError);
}