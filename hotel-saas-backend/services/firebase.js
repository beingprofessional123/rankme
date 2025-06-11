const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Optional: projectId, databaseURL, etc.
});

module.exports = admin;
