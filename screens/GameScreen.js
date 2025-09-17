// screens/GameScreen.js
import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions, 
  ScrollView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Background image
const backgroundImage = { 
  uri: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=3000&q=80' 
};

// Only 4 Levels
const levels = [
  { id: 1, title: "Beginner", difficulty: "Easy" },
  { id: 2, title: "Intermediate", difficulty: "Medium" },
  { id: 3, title: "Advanced", difficulty: "Hard" },
  { id: 4, title: "Expert", difficulty: "Expert" },
];

export default function GameScreen({ navigation }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLevelPress = (level) => {
    switch(level.id) {
      case 1: 
        navigation.navigate("BeginnerScreen", { level: "Beginner" }); 
        break;
      case 2: 
        navigation.navigate("IntermediateScreen", { level: "Intermediate" }); 
        break;
      case 3: 
        navigation.navigate("AdvancedScreen", { level: "Advanced" }); 
        break;
      case 4: 
        navigation.navigate("ExpertScreen", { level: "Expert" }); 
        break;
      default: 
        break;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      case 'Expert': return '#9C27B0';
      default: return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SELECT LEVEL</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Levels */}
          <ScrollView style={styles.levelsScrollView} contentContainerStyle={styles.levelsContainer}>
            {levels.map((level) => (
              <Animated.View 
                key={level.id}
                style={[
                  styles.levelBox,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={[styles.levelButton, { borderColor: getDifficultyColor(level.difficulty) }]}
                  onPress={() => handleLevelPress(level)}
                >
                  <Text style={styles.levelTitle}>{level.title}</Text>
                  <View style={[styles.difficultyPill, { backgroundColor: getDifficultyColor(level.difficulty) }]}>
                    <Text style={styles.levelDifficulty}>{level.difficulty}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap a level to start playing!</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', padding: 10 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingTop: 50, 
    paddingBottom: 20 
  },
  backButton: { 
    padding: 5, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white', 
    letterSpacing: 2 
  },
  placeholder: { width: 38 },
  levelsScrollView: { flex: 1 },
  levelsContainer: { paddingBottom: 30 },
  levelBox: { marginBottom: 20, alignItems: 'center' },
  levelButton: { 
    width: width - 60, 
    borderWidth: 2, 
    borderRadius: 15, 
    padding: 20, 
    alignItems: 'center' 
  },
  levelTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: 'white', 
    marginBottom: 8 
  },
  difficultyPill: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  levelDifficulty: { 
    fontSize: 12, 
    color: 'white', 
    fontWeight: 'bold' 
  },
  footer: { 
    paddingVertical: 15, 
    alignItems: 'center' 
  },
  footerText: { 
    color: 'rgba(255, 255, 255, 0.7)', 
    fontSize: 14, 
    fontStyle: 'italic' 
  },
});