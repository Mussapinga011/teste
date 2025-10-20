const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.generateQuiz = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to take a quiz.');
    }

    const { disciplina, difficulty } = data; // difficulty can be used later

    const questionsSnapshot = await db.collection('contents')
        .where('disciplina', '==', disciplina)
        .where('tipo', '==', 'exercicio')
        .get();

    if (questionsSnapshot.empty) {
        return [];
    }

    const allQuestions = questionsSnapshot.docs.flatMap(doc => doc.data().questoes);

    // Return 10 random questions
    return allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
});