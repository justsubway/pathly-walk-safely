import React, { useState } from 'react';
import { AppRegistry, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './app/HomeScreen';
import ModernSplashScreen from './app/components/ModernSplashScreen';

// Disable debug warnings and LogBox
LogBox.ignoreAllLogs(true);

export default function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = () => {
    setShowSplash(false);
  };
  if (showSplash) {
    return (
      <>
        <ModernSplashScreen onAnimationFinish={handleSplashFinish} />
        <StatusBar style="auto" />
      </>
    );
  }
  return (
    <>
      <HomeScreen />
      <StatusBar style="auto" />
    </>
  );
}
AppRegistry.registerComponent('main', () => App);