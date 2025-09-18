import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { MOCK_CIRCLES, ALL_POSTS, MOCK_USERS, MOCK_CONVERSATIONS, MOCK_USER_CONVERSATIONS, MOCK_NOTIFICATIONS } from './constants';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCC0zsn50VGGEC3-HJ19lWMrKS2-YDcwYU",
  authDomain: "circle-c134c.firebaseapp.com",
  projectId: "circle-c134c",
  storageBucket: "circle-c134c.firebasestorage.app",
  messagingSenderId: "747239155370",
  appId: "1:747239155370:web:e50afd300ba47629e9d2d3",
  measurementId: "G-DXGJQCZC32"
};

// Initialize Firebase
// FIX: Use v8 compat initialization to avoid re-initializing.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}


// FIX: Export v8 compat services and modules.
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const FieldValue = firebase.firestore.FieldValue;
export const Timestamp = firebase.firestore.Timestamp;
export { firebase as app }; // Export for checking config in App.tsx

// Configure Firestore settings. This should be done before any other Firestore operations.
db.settings({
  // This setting prevents errors when writing objects with `undefined` properties.
  // The SDK will simply ignore these properties instead of throwing an error.
  ignoreUndefinedProperties: true,
  // This forces the SDK to use a more compatible transport layer, which can
  // resolve stubborn connection issues in some network environments.
  experimentalForceLongPolling: true,
});

// Enable offline persistence to handle connection issues gracefully.
// FIX: Use v8 compat syntax for enabling persistence.
db.enablePersistence().catch((err: any) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support this feature.');
    } else {
        console.error('Firestore persistence error:', err);
    }
});

export const seedDatabase = async () => {
    const collectionsToSeed = [
        { name: 'users', data: MOCK_USERS },
        { name: 'circles', data: MOCK_CIRCLES },
        { name: 'posts', data: ALL_POSTS },
        { name: 'conversations', data: MOCK_CONVERSATIONS },
        { name: 'userConversations', data: MOCK_USER_CONVERSATIONS },
        { name: 'notifications', data: MOCK_NOTIFICATIONS },
    ];

    try {
        // FIX: Use v8 compat syntax for queries and batch writes.
        const usersQuery = db.collection('users').limit(1);
        const usersSnapshot = await usersQuery.get();

        if (usersSnapshot.empty) {
            console.log('Database appears empty, seeding data...');
            const batch = db.batch();

            for (const collectionInfo of collectionsToSeed) {
                collectionInfo.data.forEach((item: any) => {
                    const docRef = db.collection(collectionInfo.name).doc(item.id);
                    // Convert date strings/objects to Date objects, which Firestore SDK handles.
                    const sanitizedItem = JSON.parse(JSON.stringify(item), (key, value) => {
                        if (key === 'timestamp' && value) {
                            return new Date(value);
                        }
                        return value;
                    });
                    batch.set(docRef, sanitizedItem);
                });
            }
            
            await batch.commit();
            console.log('Database seeded successfully.');
        }
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};