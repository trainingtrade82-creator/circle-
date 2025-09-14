import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { MOCK_CIRCLES, ALL_POSTS, MOCK_USERS, MOCK_CONVERSATIONS, MOCK_USER_CONVERSATIONS, MOCK_NOTIFICATIONS } from './constants';
import type { Circle, Post, User, ChatConversation, UserConversation, Notification } from './types';


const firebaseConfig = {
  apiKey: "AIzaSyCC0zsn50VGGEC3-HJ19lWMrKS2-YDcwYU",
  authDomain: "circle-c134c.firebaseapp.com",
  databaseURL: "https://circle-c134c-default-rtdb.firebaseio.com",
  projectId: "circle-c134c",
  storageBucket: "circle-c134c.firebasestorage.app",
  messagingSenderId: "747239155370",
  appId: "1:747239155370:web:e50afd300ba47629e9d2d3",
  measurementId: "G-DXGJQCZC32"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable offline persistence to handle connection issues gracefully.
try {
    db.enablePersistence();
} catch (err: any) {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support this feature.');
    }
}

export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export const seedDatabase = async () => {
    const collectionsToSeed = [
        { name: 'users', data: MOCK_USERS, type: 'User' },
        { name: 'circles', data: MOCK_CIRCLES, type: 'Circle' },
        { name: 'posts', data: ALL_POSTS, type: 'Post' },
        { name: 'conversations', data: MOCK_CONVERSATIONS, type: 'ChatConversation' },
        { name: 'userConversations', data: MOCK_USER_CONVERSATIONS, type: 'UserConversation' },
        { name: 'notifications', data: MOCK_NOTIFICATIONS, type: 'Notification' },
    ];

    try {
        const usersSnapshot = await db.collection('users').limit(1).get();

        if (usersSnapshot.empty) {
            console.log('Database appears empty, seeding data...');
            const batch = db.batch();

            for (const collection of collectionsToSeed) {
                const collectionRef = db.collection(collection.name);
                collection.data.forEach((item: any) => {
                    const docRef = collectionRef.doc(item.id);
                    // Convert date strings/objects to Firestore Timestamps for consistency
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