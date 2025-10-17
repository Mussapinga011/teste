const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

// Generate Random Quiz
exports.generateQuiz = functions.https.onCall(async (data, context) => {
    // ... function logic
});