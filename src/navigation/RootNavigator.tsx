import React from 'react';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import ScriptEditorScreen from '../screens/ScriptEditorScreen';
import CameraScreen from '../screens/CameraScreen';
import AllScriptsScreen from '../screens/AllScriptsScreen';
import AboutScreen from '../screens/AboutScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        initialRouteName="Dashboard"
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ScriptEditor" component={ScriptEditorScreen} />
        <Stack.Screen name="AllScripts" component={AllScriptsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
