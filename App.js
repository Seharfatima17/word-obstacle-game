import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Homescreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import AdvancedScreen from './screens/AdvancedScreen';
import BeginnerScreen from './screens/BeginnerScreen';
import IntermediateScreen from './screens/IntermediateScreen';
import ExpertScreen from './screens/ExpertScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false
        }}
      >
          
        <Stack.Screen name="Home" component={Homescreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="AdvancedScreen" component={AdvancedScreen} />
        <Stack.Screen name="BeginnerScreen" component={BeginnerScreen} />
        <Stack.Screen name="IntermediateScreen" component={IntermediateScreen} />
        <Stack.Screen name="ExpertScreen" component={ExpertScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}