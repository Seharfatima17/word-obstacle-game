// firebase/FirebaseHelper.js
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const saveScoreToFirebase = async (score) => {
  try {
    const user = auth.currentUser;
    let userData = {};
    
    
    
    await addDoc(collection(db, "obstacle_game"), {
      ...userData,
      score: score,
      timestamp: serverTimestamp(),
    });
    
    console.log("Score saved to Firebase!");
    return true;
  } catch (error) {
    console.error("Error saving score to Firebase:", error);
    throw error;
  }
};