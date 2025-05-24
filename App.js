import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import DashboardScreen from './src/screens/Home/DashboardScreen';
import ProfileScreen from './src/screens/Home/ProfileScreen';
import BookDetailScreen from './src/screens/Books/BookDetailScreen';
import BookFormScreen from './src/screens/Books/BookFormScreen';
import { auth } from './src/services/firebase';

// Ignorar advertencia específica que no afecta la funcionalidad
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested'
]);

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario con sesión activa
    const checkLoginState = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // Usuario con sesión activa
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
              // Si hay autenticación pero no datos locales, cerramos sesión
              await auth.signOut();
              setInitialRoute('Welcome');
            } else {
              setInitialRoute('Dashboard');
            }
          } else {
            // No hay usuario con sesión activa
            setInitialRoute('Welcome');
          }
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error checking auth state:', error);
        setInitialRoute('Welcome');
        setIsLoading(false);
      }
    };

    checkLoginState();
  }, []);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#059669" />
      </LinearGradient>
    );
  }

  // Configuración de navegación principal
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="BookDetailScreen" component={BookDetailScreen} />
        <Stack.Screen name="BookFormScreen" component={BookFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}