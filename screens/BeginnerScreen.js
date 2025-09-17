import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Image,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { db, auth } from '../firebase/firebase';
import { saveScoreToFirebase } from '../firebase/FirebaseHelper';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get("window");
const LANES = [width * 0.2, width * 0.5, width * 0.8];

// Beginner Level: Focus on identifying SHORT vowel sounds
const WORDS = [
  { word: "cat", isCorrect: true },      // Short A
  { word: "sit", isCorrect: true },      // Short I
  { word: "pot", isCorrect: true },      // Short O
  { word: "cup", isCorrect: true },      // Short U
  { word: "bed", isCorrect: true },      // Short E
  { word: "bag", isCorrect: true },      // Short A
  { word: "log", isCorrect: true },      // Short O
  { word: "fin", isCorrect: true },      // Short I
  { word: "bus", isCorrect: true },      // Short U
  { word: "pen", isCorrect: true },      // Short E
  
  { word: "cake", isCorrect: false },    // Long A
  { word: "kite", isCorrect: false },    // Long I
  { word: "rope", isCorrect: false },    // Long O
  { word: "cube", isCorrect: false },    // Long U
  { word: "team", isCorrect: false },    // Long E
  { word: "rain", isCorrect: false },    // Long A
  { word: "boat", isCorrect: false },    // Long O
  { word: "seed", isCorrect: false },    // Long E
  { word: "bike", isCorrect: false },    // Long I
  { word: "mule", isCorrect: false },    // Long U
];

export default function BeginnerVowelGame() {
  const navigation = useNavigation();
  const [playerLane, setPlayerLane] = useState(1);
  const [fallingWords, setFallingWords] = useState([]);
  const [score, setScore] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [usedWordIds, setUsedWordIds] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(true);

  // Game over hone par score save karein
  useEffect(() => {
    if (isGameOver && !scoreSaved) {
      saveScoreToFirebase(score, "beginner")
        .then(() => {
          console.log("Beginner level score saved successfully");
          setScoreSaved(true);
        })
        .catch(error => {
          console.error("Failed to save score:", error);
        });
    }
  }, [isGameOver, scoreSaved]);

  // Spawn falling words
  useEffect(() => {
    if (isPaused || isGameOver) return;
    const interval = setInterval(() => {
      const availableWords = WORDS.filter(
        (_, idx) => !usedWordIds.has(idx)
      );

      if (availableWords.length === 0) {
        setUsedWordIds(new Set());
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const chosenWord = availableWords[randomIndex];
      const wordIndex = WORDS.findIndex((w) => w.word === chosenWord.word);

      setUsedWordIds((prev) => new Set([...prev, wordIndex]));

      const randomLane = Math.floor(Math.random() * 3);
      setFallingWords((prev) => [
        ...prev,
        {
          ...chosenWord,
          lane: randomLane,
          y: 0,
          id: Date.now(),
          hit: false,
        },
      ]);
    }, 1500); // Slower than intermediate level

    return () => clearInterval(interval);
  }, [isPaused, usedWordIds, isGameOver]);

  // Move words down
  useEffect(() => {
    if (isPaused || isGameOver) return;
    const gameLoop = setInterval(() => {
      setFallingWords((prev) =>
        prev
          .map((w) => ({ ...w, y: w.y + 8 })) // Slower falling speed
          .filter((w) => w.y < height - 150)
      );
    }, 120); // Slower movement

    return () => clearInterval(gameLoop);
  }, [isPaused, isGameOver]);

  // Collision detection
  useEffect(() => {
    if (isPaused || isGameOver) return;
    fallingWords.forEach((word) => {
      if (word.y > height - 250 && word.lane === playerLane && !word.hit) {
        if (word.isCorrect) {
          setScore((s) => s + 5); // Fewer points for beginner level
          showFloatingText("+5", "lime", word.lane);
        } else {
          setScore((s) => Math.max(0, s - 5)); // Less penalty for wrong answers
          showFloatingText("-5", "red", word.lane);
        }

        setFallingWords((prev) =>
          prev.map((w) => (w.id === word.id ? { ...w, hit: true } : w))
        );

        setTimeout(() => {
          setFallingWords((prev) => prev.filter((w) => w.id !== word.id));
        }, 300);
      }
    });
  }, [fallingWords, isPaused, isGameOver]);

  // Floating score text
  const showFloatingText = (text, color, lane) => {
    const id = Date.now();
    setFloatingTexts((prev) => [
      ...prev,
      { id, text, color, lane, y: height - 220 },
    ]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 600);
  };

  // Timer logic
  useEffect(() => {
    if (isPaused || isGameOver) return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, isGameOver]);

  // Handle pause
  const handlePause = () => {
    setIsPaused(true);
    setShowPauseMenu(true);
  };

  // Handle resume with countdown
  const handleResume = () => {
    setShowPauseMenu(false);
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        setIsPaused(false);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  // Restart game
  const handlePlayAgain = () => {
    setIsGameOver(false);
    setScore(0);
    setTimeLeft(60);
    setFallingWords([]);
    setUsedWordIds(new Set());
    setScoreSaved(false);
  };

  // Navigate to Home
  const handleBack = () => {
    navigation.navigate("Game"); 
  };

  // Start game after instructions
  const startGame = () => {
    setInstructionsVisible(false);
  };

  return (
    <ImageBackground
      source={{
        uri: "https://i.pinimg.com/736x/38/da/65/38da65be8771110eb943749dbfcec83e.jpg",
      }}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Instructions Modal */}
      <Modal visible={instructionsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Beginner Level</Text>
            <Text style={styles.instructionsSubtitle}>Short Vowel Sounds</Text>
            
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsText}>
                🎯 <Text style={styles.bold}>Goal:</Text> Catch words with SHORT vowel sounds
              </Text>
              <Text style={styles.instructionsText}>
                ✅ <Text style={styles.bold}>Correct:</Text> cat, sit, pot, cup, bed
              </Text>
              <Text style={styles.instructionsText}>
                ❌ <Text style={styles.bold}>Avoid:</Text> cake, kite, rope, team, rain
              </Text>
              <Text style={styles.instructionsText}>
                ⭐ <Text style={styles.bold}>Scoring:</Text> +5 points for correct words
              </Text>
              <Text style={styles.instructionsText}>
                ⚠️ <Text style={styles.bold}>Penalty:</Text> -5 points for wrong words
              </Text>
            </View>

            <TouchableOpacity style={styles.startGameBtn} onPress={startGame}>
              <Text style={styles.startGameText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Score + Pause Button + Timer */}
      {!isGameOver && !instructionsVisible && (
        <View style={styles.topBar}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.timer}>⏳ {timeLeft}s</Text>
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
            <Text style={{ fontSize: 26, color: "#fff" }}>⏸️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Falling words */}
      {!isGameOver && !instructionsVisible &&
        fallingWords.map((word) => (
          <View
            key={word.id}
            style={{
              position: "absolute",
              left: LANES[word.lane] - 40,
              top: word.y,
              alignItems: "center",
            }}
          >
            <Image
              source={{
                uri: "https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-8a8c-61f7-b446-c733852af1ef/raw?se=2025-08-25T14%3A35%3A20Z&sp=r&sv=2024-08-04&sr=b&scid=a9a458c0-317a-5f2e-abd8-c71a8e57f257&skoid=ec8eb293-a61a-47e0-abd0-6051cc94b050&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-24T18%3A26%3A52Z&ske=2025-08-25T18%3A26%3A52Z&sks=b&skv=2024-08-04&sig=JFV/rs2k8d%2BlDWlOfy/cEy%2BrYfC/51T1XERpZkxnlAE%3D",
              }}
              style={styles.asteroid}
            />
            <Text style={styles.wordText}>{word.word}</Text>
          </View>
        ))}

      {/* Floating texts */}
      {floatingTexts.map((t) => (
        <Text
          key={t.id}
          style={[
            styles.floatingText,
            {
              left: LANES[t.lane] - 20,
              top: t.y,
              color: t.color,
            },
          ]}
        >
          {t.text}
        </Text>
      ))}

      {/* Player */}
      {!isGameOver && !instructionsVisible && (
        <Text
          style={[
            styles.player,
            { left: LANES[playerLane] - 35, top: height - 120 },
          ]}
        >
          👩‍🚀
        </Text>
      )}

      {/* Controls */}
      {!isGameOver && !instructionsVisible && (
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => setPlayerLane(Math.max(0, playerLane - 1))}
            style={[styles.btn, { backgroundColor: "#ff9800" }]}
          >
            <Text style={styles.btnText}>⬅️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPlayerLane(Math.min(2, playerLane + 1))}
            style={[styles.btn, { backgroundColor: "#4caf50" }]}
          >
            <Text style={styles.btnText}>➡️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pause Menu */}
      <Modal visible={showPauseMenu} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pauseBox}>
            <Text style={styles.pauseIcon}>⏸️</Text>
            <Text style={styles.pauseTitle}>Game Paused</Text>

            <TouchableOpacity style={styles.pauseBtnStyled} onPress={handleResume}>
              <Text style={styles.pauseBtnText}>▶️ Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pauseBtnStyled, { backgroundColor: "tomato" }]}
              onPress={handleBack}
            >
              <Text style={styles.pauseBtnText}>🏠 Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Game Over Screen */}
      <Modal visible={isGameOver} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⏰ Time's Up!</Text>
            <Text style={{ fontSize: 20, color: "#fff", marginBottom: 20 }}>
              Your Score: {score}
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handlePlayAgain}>
              <Text style={styles.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "tomato" }]}
              onPress={handleBack}
            >
              <Text style={styles.modalBtnText}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Countdown */}
      {countdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  topBar: {
    position: "absolute",
    top: 34,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  score: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#6e6868ff",
    borderRadius: 20,
    paddingVertical: 4,
    textAlign: "center",
    width: 140,
    marginRight: 10,
  },

  timer: {
    fontSize: 20,
    fontWeight: "bold",
    color: "yellow",
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  pauseBtn: {
    marginLeft: 10,
    backgroundColor: "#444",
    padding: 11,
    borderRadius: 10,
  },

  asteroid: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    backgroundColor: "transparent",
  },

  wordText: {
    position: "absolute",
    top: 25,
    fontWeight: "bold",
    fontSize: 24,
    color: "#fbfbfbff",
    textAlign: "center",
    width: 80,
  },

  player: { position: "absolute", fontSize: 60 },

  floatingText: {
    position: "absolute",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  controls: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 40,
  },

  btn: {
    padding: 18,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
  },

  btnText: { fontSize: 28, color: "#fff" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsBox: {
    backgroundColor: "rgba(45, 45, 45, 0.95)",
    padding: 30,
    borderRadius: 25,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
    textAlign: "center",
  },
  instructionsSubtitle: {
    fontSize: 20,
    color: "#FFC107",
    marginBottom: 20,
    fontWeight: "600",
  },
  instructionsContent: {
    marginBottom: 25,
    width: "100%",
  },
  instructionsText: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
    textAlign: "left",
  },
  bold: {
    fontWeight: "bold",
  },
  startGameBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  startGameText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  pauseBox: {
    backgroundColor: "rgba(198, 198, 198, 0.4)",
    padding: 30,
    borderRadius: 25,
    width: 250,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  pauseIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  pauseTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 25,
  },
  pauseBtnStyled: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginVertical: 10,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 2 },
  },
  pauseBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBox: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 15,
    width: 280,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  countdownText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
  },
});