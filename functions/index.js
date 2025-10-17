const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.content = require('./content');
exports.quizzes = require('./quizzes');
exports.users = require('./users');