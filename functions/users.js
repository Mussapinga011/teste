const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

// Function to create a user profile in Firestore when a new user signs up
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
    const userObject = {
        email: user.email,
        name: user.displayName,
        progress: {},
        favoritos: [],
    };
    return db.collection('users').doc(user.uid).set(userObject);
});


// Register User Progress
exports.registerProgress = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to register progress.');
    }

    const { disciplina, acertos, erros } = data;
    const userDocRef = db.collection('users').doc(context.auth.uid);

    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User document does not exist.');
        }

        const currentProgress = userDoc.data().progress[disciplina] || { acertos: 0, erros: 0 };

        const newProgress = {
            acertos: currentProgress.acertos + acertos,
            erros: currentProgress.erros + erros,
            ultimaData: new Date(),
        };

        transaction.update(userDocRef, {
            [`progress.${disciplina}`]: newProgress,
        });

        return newProgress;
    });
});

exports.setAdminRole = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can set other users as admins.');
    }

    const { email } = data;
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        return { message: `Success! ${email} has been made an admin.` };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Error setting custom claims', error);
    }
});