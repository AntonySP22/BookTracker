import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { getBookById, addBook, updateBook } from '../../services/bookService';

const BookFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId, isNewBook = false } = route.params || {};

  // Datos del libro que se está creando o editando
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    status: "",
    startDate: "",
    endDate: "",
    comment: "",
  });

  // Estados para controlar las diferentes situaciones de carga
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Configuración del selector desplegable para el estado del libro
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusItems, setStatusItems] = useState([
    { label: "Por leer", value: "to-read" },
    { label: "Leyendo", value: "reading" },
    { label: "Completado", value: "completed" },
  ]);

  // Control de visibilidad para los selectores de fecha
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Si estamos editando un libro, cargamos sus datos
  useEffect(() => {
    if (!isNewBook && bookId) {
      const fetchBook = async () => {
        setIsLoading(true);
        try {
          const book = await getBookById(bookId);
          
          // Convertir fechas a objetos Date si existen
          setBookData({
            title: book.title || "",
            author: book.author || "",
            status: book.status || "",
            startDate: book.startDate ? new Date(book.startDate) : "",
            endDate: book.endDate ? new Date(book.endDate) : "",
            comment: book.comment || "",
          });
          setError(null);
        } catch (err) {
          console.error('Error al cargar el libro:', err);
          setError(err.message || 'No se pudo cargar el libro para editar');
          Alert.alert('Error', 'No se pudo cargar el libro para editar');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBook();
    }
  }, [bookId, isNewBook]);

  // Actualiza un campo específico del libro
  const handleChange = (name, value) => {
    setBookData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Maneja los cambios en la fecha de inicio
  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || bookData.startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    handleChange('startDate', currentDate);
  };

  // Maneja los cambios en la fecha de finalización
  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || bookData.endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    handleChange('endDate', currentDate);
  };

  // Formatea la fecha para mostrarla al usuario
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString();
  };

  // Procesa el envío del formulario (crear o actualizar)
  const handleSubmit = async () => {
    // Validamos que los campos obligatorios estén completos
    if (!bookData.title.trim()) {
      Alert.alert("Error", "Por favor, ingresa un título para el libro");
      return;
    }
    if (!bookData.author.trim()) {
      Alert.alert("Error", "Por favor, ingresa un autor para el libro");
      return;
    }
    if (!bookData.status) {
      Alert.alert("Error", "Por favor, selecciona un estado para el libro");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convertimos las fechas a formato de texto para guardarlo
      const formattedData = {
        ...bookData,
        startDate: bookData.startDate ? new Date(bookData.startDate).toISOString().split('T')[0] : null,
        endDate: bookData.endDate ? new Date(bookData.endDate).toISOString().split('T')[0] : null,
      };

      // Guardamos como nuevo libro o actualizamos uno existente
      if (isNewBook) {
        await addBook(formattedData);
        Alert.alert(
          "Libro creado",
          `${bookData.title} ha sido agregado correctamente`,
          [{ text: "OK", onPress: () => navigation.navigate("Dashboard") }]
        );
      } else {
        await updateBook(bookId, formattedData);
        Alert.alert(
          "Libro actualizado",
          `${bookData.title} ha sido actualizado correctamente`,
          [{ text: "OK", onPress: () => navigation.navigate("BookDetailScreen", { bookId }) }]
        );
      }
    } catch (err) {
      console.error('Error al guardar el libro:', err);
      Alert.alert('Error', err.message || 'No se pudo guardar el libro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de carga mientras se obtienen los datos
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando datos del libro...</Text>
      </LinearGradient>
    );
  }

  // Textos dinámicos según estemos creando o editando
  const screenTitle = isNewBook ? "Nuevo libro" : "Editar libro";
  const buttonText = isNewBook ? "Crear libro" : "Guardar cambios";
  const backText = isNewBook ? "Cancelar" : "Volver a detalles";
  const backRoute = isNewBook ? () => navigation.goBack() : 
    () => navigation.navigate("BookDetailScreen", { bookId });

  // Contenido principal del formulario
  return (
    <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Botón para volver */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={backRoute}
            disabled={isSubmitting}
          >
            <Feather name="arrow-left" size={18} color="#059669" />
            <Text style={styles.backLinkText}>{backText}</Text>
          </TouchableOpacity>

          {/* Tarjeta del formulario */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{screenTitle}</Text>
            </View>

            <View style={styles.cardContent}>
              {/* Campos del formulario */}
              <View style={styles.formContainer}>
                {/* Campo de título */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Título *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bookData.title}
                    onChangeText={(value) => handleChange("title", value)}
                    placeholder="Ingresa el título del libro"
                    editable={!isSubmitting}
                  />
                </View>

                {/* Campo de autor */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Autor *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bookData.author}
                    onChangeText={(value) => handleChange("author", value)}
                    placeholder="Ingresa el nombre del autor"
                    editable={!isSubmitting}
                  />
                </View>

                {/* Selector de estado de lectura */}
                <View style={[styles.formField, { zIndex: 1000 }]}>
                  <Text style={styles.fieldLabel}>Estado *</Text>
                  <DropDownPicker
                    open={statusOpen}
                    value={bookData.status}
                    items={statusItems}
                    setOpen={setStatusOpen}
                    setValue={(callback) => {
                      if (typeof callback === 'function') {
                        const newStatus = callback(bookData.status);
                        handleChange("status", newStatus);
                      } else {
                        handleChange("status", callback);
                      }
                    }}
                    setItems={setStatusItems}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Selecciona el estado de lectura"
                    disabled={isSubmitting}
                  />
                </View>

                {/* Campos de fechas */}
                <View style={styles.rowFields}>
                  {/* Fecha de inicio */}
                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Fecha de inicio</Text>
                    <TouchableOpacity
                      style={[
                        styles.dateButton,
                        bookData.status === "to-read" && styles.disabledInput
                      ]}
                      onPress={() => bookData.status !== "to-read" && setShowStartDatePicker(true)}
                      disabled={bookData.status === "to-read" || isSubmitting}
                    >
                      <Text style={bookData.status === "to-read" ? styles.dateTextDisabled : styles.dateText}>
                        {bookData.startDate ? formatDate(bookData.startDate) : "Seleccionar fecha "}
                      </Text>
                      <Feather name="calendar" size={16} color={bookData.status === "to-read" ? "#9CA3AF" : "#059669"} />
                    </TouchableOpacity>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={bookData.startDate ? new Date(bookData.startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onStartDateChange}
                        maximumDate={new Date()}
                      />
                    )}
                  </View>

                  {/* Fecha de finalización */}
                  <View style={[styles.formField, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.fieldLabel}>Fecha de finalización</Text>
                    <TouchableOpacity
                      style={[
                        styles.dateButton,
                        bookData.status !== "completed" && styles.disabledInput
                      ]}
                      onPress={() => bookData.status === "completed" && setShowEndDatePicker(true)}
                      disabled={bookData.status !== "completed" || isSubmitting}
                    >
                      <Text style={bookData.status !== "completed" ? styles.dateTextDisabled : styles.dateText}>
                        {bookData.endDate ? formatDate(bookData.endDate) : "Seleccionar fecha "}
                      </Text>
                      <Feather name="calendar" size={16} color={bookData.status !== "completed" ? "#9CA3AF" : "#059669"} />
                    </TouchableOpacity>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={bookData.endDate ? new Date(bookData.endDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onEndDateChange}
                        maximumDate={new Date()}
                        minimumDate={bookData.startDate ? new Date(bookData.startDate) : undefined}
                      />
                    )}
                  </View>
                </View>

                {/* Campo de comentarios */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Comentarios</Text>
                  <TextInput
                    style={styles.textArea}
                    value={bookData.comment}
                    onChangeText={(value) => handleChange("comment", value)}
                    placeholder="Escribe tus comentarios sobre el libro"
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Botones del formulario */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={backRoute}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="save" size={16} color="#FFFFFF" style={styles.saveButtonIcon} />
                      <Text style={styles.saveButtonText}>{buttonText}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backLinkText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#059669',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardContent: {
    padding: 16,
  },
  formContainer: {
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dateTextDisabled: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  disabledButton: {
    opacity: 0.7,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  dropdown: {
    borderColor: '#D1D5DB',
    height: 40,
    marginTop: 0,
  },
  dropdownContainer: {
    borderColor: '#D1D5DB',
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default BookFormScreen;

// Utilidades para manejar fechas en toda la aplicación
const formatDateForStorage = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};