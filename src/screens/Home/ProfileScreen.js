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
import { auth } from '../../services/firebase';
import { getUserReadingStats } from '../../services/bookService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pantalla principal que muestra el perfil del usuario y estadísticas de lectura
const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [readingStats, setReadingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Función para cargar datos del usuario y calcular estadísticas
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      
      try {
        // Intentar obtener datos de AsyncStorage
        const storedUserData = await AsyncStorage.getItem('userData');
        let user = null;
        
        if (storedUserData) {
          user = JSON.parse(storedUserData);
        } else {
          // Si no hay datos, usamos datos de muestra
          user = {
            fullName: "Usuario de Prueba",
            email: "usuario@example.com",
            joinDate: "2023-05-01"
          };
        }
        
        setUserData(user);
        
        // Obtener estadísticas reales de Firebase
        if (auth.currentUser) {
          // Recuperamos las estadísticas de lectura desde la base de datos
          const stats = await getUserReadingStats();
          setReadingStats(stats);
        } else {
          // Si no hay usuario autenticado, usar datos de prueba
          setReadingStats({
            total: 0,
            reading: 0,
            completed: 0,
            toRead: 0
          });
        }
        
      } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        
        // En caso de error, establecer datos predeterminados
        setUserData({
          fullName: auth.currentUser?.displayName || "Usuario de Prueba",
          email: auth.currentUser?.email || "usuario@example.com",
          joinDate: "2025-05-23"
        });
        
        // Usar estadísticas básicas como fallback
        setReadingStats({
          total: 0,
          reading: 0,
          completed: 0,
          toRead: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Iniciamos la carga de datos cuando se muestra la pantalla
    loadUserData();
  }, []);
  
  // Manejo del cierre de sesión
  const handleLogout = async () => {
    Alert.alert(
      '¿Cerrar sesión?',
      '¿Estás seguro de que quieres cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Cerramos sesión en Firebase y eliminamos datos locales
              await auth.signOut();
              await AsyncStorage.removeItem('userData');
              // Redirigimos al usuario a la pantalla de bienvenida
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Pantalla de carga mientras se recuperan los datos
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

  // Calcular porcentaje de libros completados usando los datos reales
  const completionPercentage = readingStats && readingStats.total > 0 
    ? Math.round((readingStats.completed / readingStats.total) * 100) 
    : 0;

  // Interfaz principal del perfil del usuario
  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          {/* Botón para regresar a la biblioteca */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Feather name="arrow-left" size={16} color="#059669" />
            <Text style={styles.backButtonText}>Volver al listado</Text>
          </TouchableOpacity>

          {/* Tarjeta con información personal del usuario */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Perfil de usuario</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.profileContainer}>
                {/* Avatar generado con iniciales del usuario */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userData?.fullName
                      ? userData?.fullName.split(" ").map((n) => n[0]).join("")
                      : "U"
                    }
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

              {/* Botón para cerrar sesión */}
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

          {/* Sección de estadísticas de lectura */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Estadísticas de lectura</Text>
            </View>
            <View style={styles.cardContent}>
              {/* Tarjetas con indicadores clave de lectura */}
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

              {/* Barra de progreso visual */}
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

// Componente reutilizable para mostrar estadísticas individuales
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