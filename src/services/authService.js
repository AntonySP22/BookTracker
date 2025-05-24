import { auth, db, firebaseTimestamp } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Verifica si hay un usuario con sesión activa
export const isUserLoggedIn = () => {
  return auth.currentUser !== null;
};

// Obtiene los datos completos del usuario actual
export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    // Busca el perfil del usuario en la base de datos
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        joinDate: userData.joinDate,
      };
    }
    
    return {
      uid: user.uid,
      email: user.email,
    };
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

// Registra un nuevo usuario en el sistema
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName } = userData;
  
  try {
    // Crea el usuario en el sistema de autenticación
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Prepara la fecha de registro en formato día/mes/año
    const today = new Date();
    const joinDate = `${today.getDate().toString().padStart(2, '0')}/${
      (today.getMonth() + 1).toString().padStart(2, '0')}/${
      today.getFullYear()}`;
    
    // Guarda el perfil del usuario en la base de datos
    await db.collection('users').doc(user.uid).set({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      joinDate,
      createdAt: firebaseTimestamp()
    });
    
    // Crea estadísticas de lectura iniciales para el usuario
    await db.collection('readingStats').doc(user.uid).set({
      total: 0,
      reading: 0,
      completed: 0,
      toRead: 0,
      lastUpdated: firebaseTimestamp()
    });
    
    // Guarda datos básicos en el almacenamiento del dispositivo
    await AsyncStorage.setItem('userData', JSON.stringify({
      uid: user.uid,
      email,
      fullName: `${firstName} ${lastName}`,
      joinDate
    }));
    
    return user;
    
  } catch (error) {
    console.error('Error de registro:', error);
    throw error;
  }
};

// Inicia sesión con email y contraseña
export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Busca información adicional del usuario
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Guarda datos en el dispositivo para acceso sin conexión
      await AsyncStorage.setItem('userData', JSON.stringify({
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName,
        joinDate: userData.joinDate
      }));
    }
    
    return user;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
};

// Cierra la sesión del usuario actual
export const logoutUser = async () => {
  try {
    await auth.signOut();
    await AsyncStorage.removeItem('userData');
    return true;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

// Envía correo para restablecer contraseña
export const resetPassword = async (email) => {
  try {
    await auth.sendPasswordResetEmail(email);
    return true;
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    throw error;
  }
};

// Actualiza datos del perfil del usuario
export const updateUserProfile = async (updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario con sesión activa');
    
    // Actualiza en la base de datos
    await db.collection('users').doc(user.uid).update({
      ...updatedData,
      updatedAt: firebaseTimestamp()
    });
    
    // Actualiza en el almacenamiento local
    const storedData = await AsyncStorage.getItem('userData');
    if (storedData) {
      const userData = JSON.parse(storedData);
      await AsyncStorage.setItem('userData', JSON.stringify({
        ...userData,
        ...updatedData
      }));
    }
    
    return true;
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};