// my_game/SoundManager.js
import { Audio } from "expo-av";

let backgroundSound;
let tapSound;

export const playBackgroundMusic = async () => {
  if (backgroundSound) {
    const status = await backgroundSound.getStatusAsync();
    if (status.isPlaying) return; // Already playing
  }
  backgroundSound = new Audio.Sound();
  try {
    await backgroundSound.loadAsync(require("../assets/sounds/music.mp3"));
    await backgroundSound.setIsLoopingAsync(true);
    await backgroundSound.setVolumeAsync(0.4); // halka volume
    await backgroundSound.playAsync();
  } catch (error) {
    console.log("Error loading background music", error);
  }
};

export const stopBackgroundMusic = async () => {
  if (backgroundSound) {
    await backgroundSound.stopAsync();
    await backgroundSound.unloadAsync();
    backgroundSound = null;
  }
};

export const playTapSound = async () => {
  if (tapSound) {
    await tapSound.replayAsync(); // Agar already loaded hai
  } else {
    tapSound = new Audio.Sound();
    try {
      await tapSound.loadAsync(require("../assets/sounds/tap-sound.mp3"));
      await tapSound.setVolumeAsync(0.6);
      await tapSound.playAsync();
    } catch (error) {
      console.log("Error loading tap sound", error);
    }
  }
};
