import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { auth, db, firebaseTimestamp } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const navigation = useNavigation();

  // Validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.length > 0) {
      setEmailError('');
    }
  };

const handleSubmit = async () => {
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    Alert.alert('Campos incompletos', 'Por favor, completa todos los campos.');
    return;
  }

  if (!isValidEmail(email)) {
    setEmailError('El formato del correo electrónico no es válido');
    Alert.alert(
      'Formato de correo inválido', 
      'Por favor ingresa una dirección de correo válida (ejemplo@dominio.com)'
    );
    return;
  }


  if (password !== confirmPassword) {
    Alert.alert(
      'Contraseñas no coinciden', 
      'Por favor, verifica que ambas contraseñas sean exactamente iguales.'
    );
    return;
  }

  if (password.length < 6) {
    Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  setIsLoading(true);

  try {
    // Verificar si el email ya está registrado
    try {
      const methods = await auth.fetchSignInMethodsForEmail(email);
      if (methods && methods.length > 0) {
        Alert.alert(
          'Email ya registrado',
          'Ya existe una cuenta con este correo. ¿Deseas iniciar sesión?',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => navigation.navigate('Login')
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
        setIsLoading(false);
        return;
      }
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setEmailError('El formato del correo electrónico no es válido');
        Alert.alert(
          'Formato de correo inválido', 
          'Por favor ingresa una dirección de correo válida (ejemplo@dominio.com)'
        );
        setIsLoading(false);
        return;
      }
    }


    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = userCred.user.uid;
    
 
    const today = new Date();
    const joinDate = `${today.getDate().toString().padStart(2, '0')}/${
      (today.getMonth() + 1).toString().padStart(2, '0')}/${
      today.getFullYear()}`;
    
    
    const userDataForStorage = {
      uid,
      email,
      fullName: `${firstName} ${lastName}`,
      joinDate
    };
    
    
    let firestoreSuccess = false;
    
    try {
      // Intentar guardar datos en Firestore con timeout
      const saveToFirestorePromise = Promise.all([
        db.collection('users').doc(uid).set({
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          email,
          joinDate,
          createdAt: firebaseTimestamp()
        }),
        
        db.collection('readingStats').doc(uid).set({
          total: 0,
          reading: 0,
          completed: 0,
          toRead: 0,
          lastUpdated: firebaseTimestamp()
        })
      ]);
      

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de operación de Firestore')), 15000)
      );
      
      
      await Promise.race([saveToFirestorePromise, timeoutPromise]);
      firestoreSuccess = true;
      
    } catch (firestoreError) {
      console.warn('Error al guardar en Firestore:', firestoreError);
      
    }
    
    // Guardar información básica en AsyncStorage de todas formas
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userDataForStorage));
    } catch (asyncStorageError) {
      console.warn('Error al guardar en AsyncStorage:', asyncStorageError);
    }


    if (firestoreSuccess) {
      Alert.alert(
        'Registro exitoso', 
        'Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.',
        [{ 
          text: 'Iniciar sesión', 
          onPress: () => navigation.navigate('Login')
        }]
      );
    } else {
      Alert.alert(
        'Cuenta creada', 
        'Tu cuenta ha sido creada pero hubo problemas al guardar algunos datos. ' +
        'Podrás iniciar sesión, pero es posible que necesites configurar tu perfil nuevamente.',
        [{ 
          text: 'Iniciar sesión', 
          onPress: () => navigation.navigate('Login')
        }]
      );
    }
    
    // Navegamos a la pantalla de login en cualquier caso
    navigation.navigate('Login');
    
  } catch (error) {
    console.error('Error en registro:', error);
    
    let errorMessage = 'Ocurrió un error durante el registro.';

    if (error.code === 'auth/email-already-in-use') {
      Alert.alert(
        'Email ya registrado',
        'Ya existe una cuenta con este correo. ¿Deseas iniciar sesión?',
        [
          {
            text: 'Iniciar sesión',
            onPress: () => navigation.navigate('Login')
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El formato del correo electrónico no es válido.';
      Alert.alert('Error', errorMessage);
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      Alert.alert('Error', errorMessage);
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
      Alert.alert('Error de conexión', errorMessage);
    } else {
      Alert.alert('Error', errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Welcome')}
                disabled={isLoading}
              >
                <Feather name="arrow-left" size={16} color="#059669" />
                <Text style={styles.backButtonText}>Volver</Text>
              </TouchableOpacity>

              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconBackground}>
                    <Feather name="book-open" size={32} color="#059669" />
                  </View>
                </View>

                <View style={styles.headerContainer}>
                  <Text style={styles.title}>Crear cuenta</Text>
                  <Text style={styles.subtitle}>
                    Regístrate para comenzar a rastrear tus libros
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.nameContainer}>
                    <View style={styles.nameField}>
                      <Text style={styles.label}>Nombre</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Elmer"
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!isLoading}
                      />
                    </View>
                    
                    <View style={styles.nameField}>
                      <Text style={styles.label}>Apellido</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Regalo"
                        value={lastName}
                        onChangeText={setLastName}
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                      style={[styles.input, emailError ? styles.inputError : null]}
                      placeholder="correo@ejemplo.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={handleEmailChange}
                      editable={!isLoading}
                    />
                    {emailError ? (
                      <Text style={styles.errorText}>{emailError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder=""
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        <Feather 
                          name={showPassword ? 'eye-off' : 'eye'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder=""
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!isLoading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        <Feather 
                          name={showConfirmPassword ? 'eye-off' : 'eye'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.registerButton, isLoading && styles.disabledButton]} 
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.registerButtonText}>Registrarse</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Login')}
                      disabled={isLoading}
                    >
                      <Text style={styles.loginLink}>Inicia sesión</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameField: {
    width: '48%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  registerButton: {
    backgroundColor: '#059669',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#10B981',
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#4b5563',
  },
  loginLink: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});

export default RegisterScreen;