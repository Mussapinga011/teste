const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

const isAdmin = async (uid) => {
    const user = await admin.auth().getUser(uid);
    return user.customClaims && user.customClaims.admin === true;
}

// Create Content
exports.createContent = functions.https.onCall(async (data, context) => {
    if (!context.auth || !await isAdmin(context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to create content.');
    }
    return db.collection('contents').add(data);
});

// Read Content (No auth required for this one, handled by security rules)
exports.getContent = functions.https.onCall(async (data, context) => {
    if (data.id) {
        const doc = await db.collection('contents').doc(data.id).get();
        return { id: doc.id, ...doc.data() };
    }
    const snapshot = await db.collection('contents').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Update Content
exports.updateContent = functions.https.onCall(async (data, context) => {
    if (!context.auth || !await isAdmin(context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to update content.');
    }
    const { id, ...rest } = data;
    return db.collection('contents').doc(id).update(rest);
});

// Delete Content
exports.deleteContent = functions.https.onCall(async (data, context) => {
    if (!context.auth || !await isAdmin(context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to delete content.');
    }
    return db.collection('contents').doc(data.id).delete();
});