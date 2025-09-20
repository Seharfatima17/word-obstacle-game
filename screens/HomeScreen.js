import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Background image - changed to a more game-appropriate image
const backgroundImage = { uri: 'https://cdn.esahubble.org/archives/images/wallpaper2/heic1509a.jpg' };

export default function Homescreen({ navigation }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Animation sequences
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handlePlayGame = () => {
    navigation.navigate('Game');
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.overlay}>
          <Animated.View style={[styles.titleContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}>
            <Text style={styles.title}>WORD</Text>
            <Text style={styles.subtitle}>OBSTACLE RACE</Text>
            <View style={styles.divider} />
          </Animated.View>
          
          <Animated.View style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim
          }}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handlePlayGame}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle" size={24} color="white" />
              <Text style={styles.buttonText}>PLAY GAME</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#4CAF50',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 3,
    marginTop: -5,
  },
  divider: {
    height: 4,
    width: 200,
    backgroundColor: '#FFC107',
    marginTop: 15,
    borderRadius: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginVertical: 12,
    minWidth: 250,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#45a049',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});