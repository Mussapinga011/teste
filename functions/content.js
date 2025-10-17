const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

// Create Content
exports.createContent = functions.https.onCall(async (data, context) => {
    // ... function logic
});

// Read Content
exports.getContent = functions.https.onCall(async (data, context) => {
    // ... function logic
});

// Update Content
exports.updateContent = functions.https.onCall(async (data, context) => {
    // ... function logic
});

// Delete Content
exports.deleteContent = functions.https.onCall(async (data, context) => {
    // ... function logic
});