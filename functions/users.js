const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

// Register User Progress
exports.registerProgress = functions.https.onCall(async (data, context) => {
    // ... function logic
});