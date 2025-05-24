import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [readingStats, setReadingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Función para cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          // Intentar obtener datos de AsyncStorage si no hay usuario autenticado
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            
            // Si hay estadísticas almacenadas en AsyncStorage, usarlas
            if (parsedData.readingStats) {
              setReadingStats(parsedData.readingStats);
            } else {
              setReadingStats({ total: 0, reading: 0, completed: 0, toRead: 0 });
            }
            setIsLoading(false);
            return;
          }
          
          Alert.alert(
            'Sesión expirada',
            'Por favor, inicia sesión nuevamente.',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }
        
        // Obtener datos actualizados del usuario desde Firestore
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
          const userFirestoreData = userDoc.data();
          
          // Crear objeto con datos del usuario
          const userInfo = {
            uid: currentUser.uid,
            email: currentUser.email,
            fullName: userFirestoreData.fullName || `${userFirestoreData.firstName} ${userFirestoreData.lastName}`,
            firstName: userFirestoreData.firstName,
            lastName: userFirestoreData.lastName,
            joinDate: userFirestoreData.joinDate
          };
          
          setUserData(userInfo);
          
          const statsDoc = await db.collection('readingStats').doc(currentUser.uid).get();
          
          if (statsDoc.exists) {
            setReadingStats(statsDoc.data());
          } else {
            const defaultStats = { total: 0, reading: 0, completed: 0, toRead: 0 };
            setReadingStats(defaultStats);
            
            await db.collection('readingStats').doc(currentUser.uid).set({
              ...defaultStats,
              lastUpdated: new Date()
            });
          }
          
          await AsyncStorage.setItem('userData', JSON.stringify({
            ...userInfo,
            readingStats: statsDoc.exists ? statsDoc.data() : { total: 0, reading: 0, completed: 0, toRead: 0 }
          }));
          
        } else {
          throw new Error('No se encontraron datos de usuario');
        }
      } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        Alert.alert(
          'Error al cargar datos',
          'No se pudieron cargar los datos del perfil. Inténtalo de nuevo más tarde.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const handleLogout = async () => {
    try {
      // Confirmar cierre de sesión
      Alert.alert(
        '¿Cerrar sesión?',
        '¿Estás seguro de que quieres cerrar tu sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              
              try {
                // Cerrar sesión en Firebase
                await auth.signOut();
                
                // Eliminar datos de AsyncStorage
                await AsyncStorage.removeItem('userData');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              } catch (error) {
                console.error('Error al cerrar sesión:', error);
                Alert.alert(
                  'Error',
                  'Ocurrió un problema al cerrar la sesión. Inténtalo de nuevo.'
                );
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert(
        'Error',
        'Ocurrió un problema al cerrar la sesión. Inténtalo de nuevo.'
      );
    }
  };


  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </LinearGradient>
    );
  }

  // Calcular porcentaje de libros completados
  const completionPercentage = readingStats && readingStats.total > 0 
    ? Math.round((readingStats.completed / readingStats.total) * 100) 
    : 0;

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Feather name="arrow-left" size={16} color="#059669" />
            <Text style={styles.backButtonText}>Volver al listado</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Perfil de usuario</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.profileContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userData?.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{userData?.fullName}</Text>
                  <Text style={styles.userEmail}>{userData?.email}</Text>
                  <Text style={styles.userJoinDate}>
                    Miembro desde {userData?.joinDate}
                  </Text>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.logoutContainer}>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                >
                  <Feather name="log-out" size={16} color="#EF4444" />
                  <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Estadísticas de lectura</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.statsGrid}>
                <StatCard 
                  icon={<Feather name="book-open" size={20} color="#059669" />}
                  title="Total"
                  value={readingStats?.total || 0}
                  description="libros"
                />
                <StatCard 
                  icon={<Feather name="book" size={20} color="#D97706" />}
                  title="Leyendo"
                  value={readingStats?.reading || 0}
                  description="libros"
                />
                <StatCard 
                  icon={<Feather name="check-circle" size={20} color="#059669" />}
                  title="Completados"
                  value={readingStats?.completed || 0}
                  description="libros"
                />
                <StatCard 
                  icon={<Feather name="bookmark" size={20} color="#2563EB" />}
                  title="Por leer"
                  value={readingStats?.toRead || 0}
                  description="libros"
                />
              </View>

              <View style={styles.progressSection}>
                <Text style={styles.progressTitle}>Progreso de lectura</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${completionPercentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {readingStats?.total > 0 
                    ? `Has completado el ${completionPercentage}% de tus libros`
                    : 'Aún no has agregado ningún libro'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const StatCard = ({ icon, title, value, description }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#059669',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardContent: {
    padding: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  profileInfo: {
    marginLeft: 24,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userJoinDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  logoutContainer: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  logoutText: {
    marginLeft: 8,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressSection: {
    marginTop: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#059669',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfileScreen;