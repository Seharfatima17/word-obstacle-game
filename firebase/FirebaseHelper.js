// firebaseHelper.js - Combined Firebase helper functions
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc,
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  updateDoc,
  limit,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase"; // ✅ Use single auth reference

// ✅ Export the Firestore functions
export { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit };

// ✅ Save score to Firebase
export const saveScoreToFirebase = async (score, level = "beginner") => {
  try {
    const user = auth.currentUser;
    let userData = {};
    
    if (user) {
      userData = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName
      };
    }

    const payload = {
      ...userData,
      gameName: "Word Obstacle Game",
      level: level,
      score: score,
      timestamp: serverTimestamp(),
    };

    console.log("Saving Score:", payload);

    await addDoc(collection(db, "obstacle_game"), payload);
    console.log("✅ Score saved to Firebase!");
    return true;
  } catch (error) {
    console.error("❌ Error saving score to Firebase:", error);
    throw error;
  }
};

// ✅ Log user progress
export const logUserProgress = async (module, level, data) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("⚠️ No user is logged in - progress not saved");
      return false;
    }

    const userId = user.uid;
    const userRef = doc(db, "userProgress", userId);

    // Get existing data first
    const docSnap = await getDoc(userRef);
    const existingData = docSnap.exists() ? docSnap.data() : {};

    // Update only the specific module data with game name and level
    const updatedData = {
      ...existingData,
      [module]: {
        ...existingData[module],
        [level]: {
          gameName: "Word Obstacle Game",
          level: level,
          ...data,
          timestamp: serverTimestamp(), // Nested timestamp allowed with merge
        }
      },
      userId,
      lastUpdated: serverTimestamp()
    };

    console.log("Saving Progress to Firestore:", updatedData);

    // ✅ Merge old + new data (avoid overwriting)
    await setDoc(userRef, updatedData, { merge: true });
    console.log("✅ Progress logged:", { userId, module, level, ...data });
    return true;
  } catch (error) {
    console.error("❌ Error logging progress:", error);
    return false;
  }
};

// ✅ Store game score
export const storeGameScore = async (module, level, scoreData) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("⚠️ No user is logged in - score not saved");
      return false;
    }

    const userId = user.uid;

    const scorePayload = {
      userId,
      gameName: "Word Obstacle Game",
      module,
      level,
      ...scoreData,
      timestamp: serverTimestamp(),
    };

    console.log("Storing Game Score:", scorePayload);

    // Add to scores collection
    await addDoc(collection(db, "scores"), scorePayload);

    // Also update user progress
    await logUserProgress(module, level, {
      lastScore: scoreData.score,
      totalQuestions: scoreData.totalQuestions,
      percentage: Math.round((scoreData.score / scoreData.totalQuestions) * 100),
      completed: scoreData.score === scoreData.totalQuestions,
      lastPlayed: serverTimestamp()
    });

    console.log("✅ Score stored in Firestore");
    return true;
  } catch (error) {
    console.error("❌ Error storing score:", error);
    return false;
  }
};

// ✅ Get user progress
export const getUserProgress = async (module = null, level = null) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("⚠️ No user is logged in");
      return null;
    }

    const userRef = doc(db, "userProgress", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Fetched Progress:", data);

      if (module && level) return data[module]?.[level] || null;
      else if (module) return data[module] || null;
      else return data;
    } else {
      console.log("⚠️ No progress data found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting user progress:", error);
    return null;
  }
};

// ✅ Get user scores with optional filtering
export const getUserScores = async (module = null, level = null, limitCount = 10) => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    let scoresQuery;
    if (module && level) {
      scoresQuery = query(
        collection(db, "scores"),
        where("userId", "==", user.uid),
        where("module", "==", module),
        where("level", "==", level),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
    } else if (module) {
      scoresQuery = query(
        collection(db, "scores"),
        where("userId", "==", user.uid),
        where("module", "==", module),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
    } else {
      scoresQuery = query(
        collection(db, "scores"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(scoresQuery);
    const scores = [];
    querySnapshot.forEach((docSnap) => {
      scores.push({ id: docSnap.id, ...docSnap.data() });
    });

    console.log("Fetched User Scores:", scores);
    return scores;
  } catch (error) {
    console.error("❌ Error getting user scores:", error);
    return [];
  }
};

// ✅ Get overall user statistics
export const getUserStats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const scoresQuery = query(
      collection(db, "scores"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(scoresQuery);
    const scores = [];
    querySnapshot.forEach((docSnap) => {
      scores.push({ id: docSnap.id, ...docSnap.data() });
    });

    const totalGames = scores.length;
    const totalCorrect = scores.reduce((sum, s) => sum + s.score, 0);
    const totalQuestions = scores.reduce((sum, s) => sum + s.totalQuestions, 0);
    const overallPercentage =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const modulesPlayed = [...new Set(scores.map((s) => s.module))];

    const stats = {
      totalGames,
      totalCorrect,
      totalQuestions,
      overallPercentage,
      modulesPlayed,
      lastPlayed: scores.length > 0 ? scores[0].timestamp : null,
    };

    console.log("Fetched User Stats:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error getting user stats:", error);
    return null;
  }
};

// ✅ Other helper functions (leaderboard, profile, etc.) remain unchanged
// -- You can keep getLeaderboard, checkUserExists, updateUserProfile,
//    getUserProfile, getModuleCompletion, getRecentActivity, resetUserProgress
//    same as before. Just remember to use { merge: true } in setDoc when updating.
