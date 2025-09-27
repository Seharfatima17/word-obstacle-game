import React, { useEffect, useState } from "react";
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
import { saveScoreToFirebase } from "../firebase/FirebaseHelper";
import { playBackgroundMusic, stopBackgroundMusic, playTapSound } from "./SoundManager"; // ✅ SOUND IMPORT

const { width, height } = Dimensions.get("window");
const LANES = [width * 0.2, width * 0.5, width * 0.8];

// ✅ Expert Level: Focus on LONG E, O, U vowel sounds
const WORDS = [
  { word: "team", isCorrect: true },
  { word: "bead", isCorrect: true },
  { word: "leaf", isCorrect: true },
  { word: "seal", isCorrect: true },
  { word: "rope", isCorrect: true },
  { word: "bone", isCorrect: true },
  { word: "cone", isCorrect: true },
  { word: "vote", isCorrect: true },
  { word: "cube", isCorrect: true },
  { word: "mule", isCorrect: true },
  { word: "fuse", isCorrect: true },
  { word: "tune", isCorrect: true },

  // Distractors
  { word: "cat", isCorrect: false },
  { word: "sit", isCorrect: false },
  { word: "cup", isCorrect: false },
  { word: "bed", isCorrect: false },
  { word: "dog", isCorrect: false },
  { word: "pen", isCorrect: false },
  { word: "hat", isCorrect: false },
  { word: "bus", isCorrect: false },
  { word: "rat", isCorrect: false },
  { word: "mug", isCorrect: false },
];

export default function ExpertVowelGame() {
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
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const [longWordsCaught, setLongWordsCaught] = useState(0);  // ✅ correct
  const [shortWordsCaught, setShortWordsCaught] = useState(0); // ✅ wrong

  // ✅ Start background music when component mounts
  useEffect(() => {
    playBackgroundMusic();
    return () => {
      stopBackgroundMusic(); // stop music when leaving this screen
    };
  }, []);

  // ✅ Save score in Firebase when game ends
  useEffect(() => {
    if (gameCompleted && isGameOver && !scoreSaved) {
      saveScoreToFirebase(score, "expert")
        .then(() => setScoreSaved(true))
        .catch((err) => console.error("Score save error:", err));
    }
  }, [gameCompleted, isGameOver, scoreSaved, score, longWordsCaught, shortWordsCaught]);

  // ✅ Spawn falling words (faster than advanced)
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const interval = setInterval(() => {
      const availableWords = WORDS.filter((_, idx) => !usedWordIds.has(idx));
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
        { ...chosenWord, lane: randomLane, y: 0, id: Date.now(), hit: false },
      ]);
    }, 900); // ⚡ slightly faster spawn
    return () => clearInterval(interval);
  }, [gameStarted, isPaused, isGameOver, usedWordIds]);

  // ✅ Move words down
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const loop = setInterval(() => {
      setFallingWords((prev) =>
        prev
          .map((w) => ({ ...w, y: w.y + 16 })) // ⚡ faster fall
          .filter((w) => w.y < height - 150)
      );
    }, 70);
    return () => clearInterval(loop);
  }, [gameStarted, isPaused, isGameOver]);

  // ✅ Collision detection
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    fallingWords.forEach((word) => {
      if (word.y > height - 250 && word.lane === playerLane && !word.hit) {
        if (word.isCorrect) {
          setScore((s) => s + 5);
          setLongWordsCaught((c) => c + 1);
          showFloatingText("+5", "lime", word.lane);
        } else {
          setScore((s) => Math.max(0, s - 5));
          setShortWordsCaught((c) => c + 1);
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
  }, [fallingWords, playerLane, gameStarted, isPaused, isGameOver]);

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

  // ✅ Timer
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          setGameCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, isPaused, isGameOver]);

  // ✅ Button handlers with tap sound
  const handlePause = async () => {
    await playTapSound();
    setIsPaused(true);
    setShowPauseMenu(true);
  };

  const handleResume = async () => {
    await playTapSound();
    setShowPauseMenu(false);
    let count = 3;
    setCountdown(count);
    const intv = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(intv);
        setCountdown(null);
        setIsPaused(false);
      } else setCountdown(count);
    }, 1000);
  };

  const handlePlayAgain = async () => {
    await playTapSound();
    setIsGameOver(false);
    setScore(0);
    setTimeLeft(60);
    setFallingWords([]);
    setUsedWordIds(new Set());
    setScoreSaved(false);
    setLongWordsCaught(0);
    setShortWordsCaught(0);
    setGameStarted(true);
    setGameCompleted(false);
  };

  const handleBack = async () => {
    await playTapSound();
    setIsGameOver(false);
    setGameStarted(false);
    setGameCompleted(false);
    setScore(0);
    setTimeLeft(60);
    setFallingWords([]);
    setUsedWordIds(new Set());
    setScoreSaved(false);
    setLongWordsCaught(0);
    setShortWordsCaught(0);
    setInstructionsVisible(true);
    navigation.navigate("Game");
  };

  const startGame = async () => {
    await playTapSound();
    setInstructionsVisible(false);
    setGameStarted(true);
  };

  const practiceMessage =
    shortWordsCaught > longWordsCaught / 2
      ? "⚠️ Needs more practice with LONG E, O, U vowels!"
      : "✅ Excellent! Great recognition of long vowels!";

  return (
    <ImageBackground
      source={{
        uri: "https://i.pinimg.com/736x/38/da/65/38da65be8771110eb943749dbfcec83e.jpg",
      }}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Instructions */}
      <Modal visible={instructionsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.instructionsBox}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={async () => {
                await playTapSound();
                navigation.navigate("Game");
              }}
            >
              <Text style={styles.backButtonText}>⬅️</Text>
            </TouchableOpacity>

            <Text style={styles.gameName}>WORD OBSTACLE GAME</Text>
            <Text style={styles.levelBadge}>EXPERT LEVEL</Text>

            <Text style={styles.instructionsSubtitle}>Long E, O, U Vowel Sounds</Text>
            <Text style={styles.instructionsText}>
              🎯 Goal: Catch words with LONG E, O, U sounds
            </Text>
            <Text style={styles.instructionsText}>
              ✅ Correct: team, rope, cube, mule, fuse
            </Text>
            <Text style={styles.instructionsText}>
              ❌ Avoid: cat, sit, cup, bed, dog
            </Text>
            <Text style={styles.instructionsText}>
              ⭐ +5 for correct, -5 for wrong
            </Text>
            <TouchableOpacity style={styles.startGameBtn} onPress={startGame}>
              <Text style={styles.startGameText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      {gameStarted && !isGameOver && (
        <View style={styles.gameHeader}>
          <Text style={styles.gameHeaderTitle}>WORD OBSTACLE GAME</Text>
          <Text style={styles.gameHeaderLevel}>EXPERT LEVEL</Text>
        </View>
      )}

      {/* Score / Timer */}
      {gameStarted && !isGameOver && (
        <View style={styles.topBar}>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>Score: {score}</Text>
          </View>
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </View>
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
            <Text style={{ fontSize: 26, color: "#fff" }}>⏸️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Falling Words */}
      {gameStarted &&
        !isPaused &&
        !isGameOver &&
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
              source={require("../assets/a.png")}
              style={styles.asteroid}
            />
            <Text style={styles.wordText}>{word.word}</Text>
          </View>
        ))}

      {/* Floating score text */}
      {floatingTexts.map((t) => (
        <Text
          key={t.id}
          style={[
            styles.floatingText,
            { left: LANES[t.lane] - 20, top: t.y, color: t.color },
          ]}
        >
          {t.text}
        </Text>
      ))}

      {/* Player */}
      {gameStarted && !isGameOver && (
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
      {gameStarted && !isPaused && !isGameOver && (
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={async () => {
              await playTapSound();
              setPlayerLane(Math.max(0, playerLane - 1));
            }}
            style={[styles.btn, { backgroundColor: "#ff9800" }]}
          >
            <Text style={styles.btnText}>⬅️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await playTapSound();
              setPlayerLane(Math.min(2, playerLane + 1));
            }}
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
            <Text style={styles.pauseGameName}>WORD OBSTACLE GAME</Text>
            <Text style={styles.pauseLevel}>Expert Level</Text>

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

      {/* Game Over */}
      <Modal visible={isGameOver && timeLeft === 0} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.gameName}>WORD OBSTACLE GAME</Text>
            <Text style={styles.levelBadge}>EXPERT LEVEL</Text>

            <Text style={styles.modalTitle}>⏰ Time's Up!</Text>
            <Text style={styles.gameOverText}>Score: {score}</Text>
            <Text style={styles.gameOverText}>
              Long Vowel Words: {longWordsCaught}
            </Text>
            <Text style={styles.gameOverText}>
              Short Vowel Words: {shortWordsCaught}
            </Text>
            <Text style={styles.practiceText}>{practiceMessage}</Text>

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
  gameHeader: {
    position: "absolute",
    top: 10,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gameHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
  },
  gameHeaderLevel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  levelBadge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 15,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  topBar: {
    position: "absolute",
    top: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scoreContainer: {
    backgroundColor: "rgba(110, 104, 104, 0.8)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 120,
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  timerLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pauseBtn: {
    backgroundColor: "rgba(68, 68, 68, 0.8)",
    padding: 11,
    borderRadius: 10,
  },
  asteroid: {
    width: 110,
    height: 90,
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
    width: 70,
  },
  player: { position: "absolute", fontSize: 70 },
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
    marginTop: 10,
  },
  instructionsSubtitle: {
    fontSize: 20,
    color: "#FFC107",
    marginBottom: 20,
    fontWeight: "600",
  },
  instructionsText: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  startGameBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  startGameText: { color: "white", fontSize: 20, fontWeight: "bold" },
  pauseBox: {
    backgroundColor: "rgba(198, 198, 198, 0.4)",
    padding: 30,
    borderRadius: 25,
    width: 250,
    alignItems: "center",
  },
  pauseIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pauseBtnStyled: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  pauseBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBox: {
    backgroundColor: "rgba(45, 45, 45, 0.95)",
    padding: 30,
    borderRadius: 25,
    width: "90%",
    maxWidth: 350,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFC107",
    marginBottom: 15,
  },
  gameOverText: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  practiceText: {
    color: "#FFC107",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    fontSize: 100,
    color: "#fff",
    fontWeight: "bold",
  },
});