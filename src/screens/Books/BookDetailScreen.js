import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { getBookById, deleteBook } from "../../services/bookService";

const BookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params || {};

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del libro cuando se monta el componente
  useEffect(() => {
    const loadBook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const bookData = await getBookById(bookId);
        setBook(bookData);
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("No se pudo cargar el libro. " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  // Colores para los diferentes estados de lectura
  const statusColors = {
    reading: { bg: "#FEF3C7", text: "#92400E" },
    completed: { bg: "#D1FAE5", text: "#065F46" },
    "to-read": { bg: "#DBEAFE", text: "#1E40AF" },
  };

  // Etiquetas para los estados de lectura
  const statusLabels = {
    reading: "Leyendo",
    completed: "Completado",
    "to-read": "Por leer",
  };

  // Manejar la eliminación de un libro
  const handleDelete = () => {
    Alert.alert(
      "¿Estás seguro?",
      `Esta acción no se puede deshacer. Esto eliminará permanentemente el libro "${book.title}" de tu biblioteca.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteBook(bookId);
              navigation.navigate("Dashboard");
            } catch (error) {
              console.error("Error al eliminar libro:", error);
              Alert.alert("Error", "No se pudo eliminar el libro: " + error.message);
              setIsLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Mostrar pantalla de carga
  if (isLoading) {
    return (
      <LinearGradient
        colors={["#ecfdf5", "#d1fae5"]}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando detalles del libro...</Text>
      </LinearGradient>
    );
  }

  // Mostrar pantalla de error o libro no encontrado
  if (error || !book) {
    return (
      <LinearGradient colors={["#ecfdf5", "#d1fae5"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundText}>{error || "Libro no encontrado"}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Volver al listado</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Pantalla principal de detalles
  return (
    <LinearGradient colors={["#ecfdf5", "#d1fae5"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Botón para volver */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Feather name="arrow-left" size={18} color="#059669" />
            <Text style={styles.backLinkText}>Volver al listado</Text>
          </TouchableOpacity>

          {/* Tarjeta de información del libro */}
          <View style={styles.card}>
            {/* Cabecera de la tarjeta */}
            <View style={styles.cardHeader}>
              <View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: statusColors[book.status].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: statusColors[book.status].text },
                    ]}
                  >
                    {statusLabels[book.status]}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{book.title}</Text>
              </View>

              {/* Botones de acción */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate("BookFormScreen", { bookId: book.id })
                  }
                >
                  <Feather name="edit" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Contenido detallado */}
            <View style={styles.cardContent}>
              {/* Información del autor */}
              <View style={styles.detailItem}>
                <Feather
                  name="user"
                  size={18}
                  color="#059669"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>Autor:</Text>
                <Text style={styles.detailText}>{book.author}</Text>
              </View>

              {/* Fechas de lectura */}
              {(book.startDate || book.endDate) && (
                <View style={styles.detailItem}>
                  <Feather
                    name="calendar"
                    size={18}
                    color="#059669"
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailLabel}>Fechas:</Text>
                  <Text style={styles.detailText}>
                    {book.startDate && `Inicio: ${book.startDate}`}
                    {book.startDate && book.endDate && " - "}
                    {book.endDate && `Fin: ${book.endDate}`}
                  </Text>
                </View>
              )}

              {/* Comentarios */}
              {book.comment && (
                <View style={styles.comment}>
                  <View style={styles.detailItem}>
                    <Feather
                      name="message-square"
                      size={18}
                      color="#059669"
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailLabel}>Comentarios:</Text>
                  </View>
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>{book.comment}</Text>
                  </View>
                </View>
              )}

              {/* Información adicional según estado */}
              {book.status === "reading" && (
                <View style={styles.statusBox}>
                  <View style={styles.detailItem}>
                    <Feather
                      name="book-open"
                      size={18}
                      color="#92400E"
                      style={styles.detailIcon}
                    />
                    <Text style={styles.statusBoxTitle}>
                      Actualmente leyendo
                    </Text>
                  </View>
                  <Text style={styles.statusBoxText}>
                    {book.startDate
                      ? `Comenzaste este libro el ${book.startDate}.`
                      : "No has registrado cuándo comenzaste este libro."}
                  </Text>
                </View>
              )}

              {book.status === "to-read" && (
                <View style={[styles.statusBox, styles.toReadBox]}>
                  <View style={styles.detailItem}>
                    <Feather
                      name="book-open"
                      size={18}
                      color="#1E40AF"
                      style={styles.detailIcon}
                    />
                    <Text style={[styles.statusBoxTitle, styles.toReadTitle]}>
                      En tu lista de lectura
                    </Text>
                  </View>
                  <Text style={[styles.statusBoxText, styles.toReadText]}>
                    Este libro está en tu lista de pendientes por leer.
                  </Text>
                </View>
              )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#059669",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 16,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "500",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backLinkText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#059669",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteButton: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  cardContent: {
    padding: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
    marginRight: 4,
  },
  detailText: {
    fontSize: 15,
    color: "#6B7280",
  },
  comment: {
    marginBottom: 16,
  },
  commentBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  commentText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  statusBox: {
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  toReadBox: {
    backgroundColor: "#DBEAFE",
  },
  statusBoxTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#92400E",
  },
  toReadTitle: {
    color: "#1E40AF",
  },
  statusBoxText: {
    fontSize: 13,
    color: "#92400E",
    marginTop: 4,
  },
  toReadText: {
    color: "#1E40AF",
  },
});

export default BookDetailScreen;
