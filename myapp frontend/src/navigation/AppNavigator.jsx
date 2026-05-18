import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Colors from '../theme/colors';

import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NotesScreen from '../screens/NotesScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ProgressScreen from '../screens/ProgressScreen';
import MockTestScreen from '../screens/MockTestScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{name}</Text>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Notes"    component={NotesScreen}    options={{ tabBarIcon: tabIcon('📚') }} />
      <Tab.Screen name="Planner"  component={PlannerScreen}  options={{ tabBarIcon: tabIcon('🗓️') }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarIcon: tabIcon('📈') }} />
      <Tab.Screen name="Test"     component={MockTestScreen} options={{ tabBarIcon: tabIcon('📝') }} />
      <Tab.Screen name="AI Chat"  component={ChatScreen}     options={{ tabBarIcon: tabIcon('🤖') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main"  component={MainTabs} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
