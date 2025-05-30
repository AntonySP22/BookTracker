import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getUserBooks } from '../../services/bookService';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar libros cada vez que la pantalla obtiene foco
  useFocusEffect(
    React.useCallback(() => {
      const loadBooks = async () => {
        setIsLoading(true);
        try {
          const userBooks = await getUserBooks();
          setBooks(userBooks);
          setFilteredBooks(userBooks);
          setError(null);
        } catch (error) {
          console.error('Error al cargar libros:', error);
          setError('No se pudieron cargar los libros. Por favor, intenta de nuevo.');
          Alert.alert('Error', 'No se pudieron cargar los libros. Por favor, intenta de nuevo.');
        } finally {
          setIsLoading(false);
        }
      };

      loadBooks();
    }, [])
  );

  // Filtrar libros cuando cambia la búsqueda o la lista de libros
  useEffect(() => {
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBooks(filtered);
  }, [searchQuery, books]);

  // Obtener libros por estado
  const readingBooks = filteredBooks.filter((book) => book.status === "reading");
  const completedBooks = filteredBooks.filter((book) => book.status === "completed");
  const toReadBooks = filteredBooks.filter((book) => book.status === "to-read");

  // Obtener los libros según la pestaña seleccionada
  const getDisplayBooks = () => {
    switch(activeTab) {
      case "reading":
        return readingBooks;
      case "completed":
        return completedBooks;
      case "to-read":
        return toReadBooks;
      default:
        return filteredBooks;
    }
  };
   
  // Navegar a la pantalla de detalles del libro
  const handleBookSelect = (bookId) => {
    navigation.navigate('BookDetailScreen', { 
      bookId: bookId,
      source: 'dashboard'
    });
  };

  // Renderizar cada tarjeta de libro
  const renderBookCard = ({ item }) => (
    <BookCard 
      book={item} 
      onPress={() => handleBookSelect(item.id)} 
    />
  );

  // Mostrar indicador de carga
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={[styles.container, styles.centerContent]}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando libros...</Text>
      </LinearGradient>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={[styles.container, styles.centerContent]}
      >
        <Feather name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            setError(null);
            loadBooks();
          }}
        >
          <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Contenido principal
  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Encabezado con título y botón de perfil */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Feather name="book-open" size={24} color="#059669" style={styles.headerIcon} />
            <Text style={styles.title}>Mis Libros</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Feather name="user" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda y botón de agregar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título o autor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('BookFormScreen', { isNewBook: true })}
          >
            <Feather name="plus" size={16} color="#FFFFFF" style={styles.addIcon} />
            <Text style={styles.addButtonText}>Nuevo libro</Text>
          </TouchableOpacity>
        </View>

        {/* Pestañas de filtro */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reading' && styles.activeTab]}
            onPress={() => setActiveTab('reading')}
          >
            <Feather name="book-open" size={16} color={activeTab === 'reading' ? "#059669" : "#6B7280"} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'reading' && styles.activeTabText]}>
              Leyendo ({readingBooks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Feather name="check-circle" size={16} color={activeTab === 'completed' ? "#059669" : "#6B7280"} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completados ({completedBooks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'to-read' && styles.activeTab]}
            onPress={() => setActiveTab('to-read')}
          >
            <Feather name="bookmark" size={16} color={activeTab === 'to-read' ? "#059669" : "#6B7280"} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'to-read' && styles.activeTabText]}>
              Por leer ({toReadBooks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de libros o mensaje de estado vacío */}
        {getDisplayBooks().length > 0 ? (
          <FlatList
            data={getDisplayBooks()}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.booksList}
          />
        ) : (
          <EmptyState 
            status={activeTab} 
            onPress={() => navigation.navigate('BookFormScreen', { isNewBook: true })}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// Componente para mostrar la tarjeta de cada libro
const BookCard = ({ book, onPress }) => {
  const statusColors = {
    reading: { bg: '#FEF3C7', text: '#92400E' },
    completed: { bg: '#D1FAE5', text: '#065F46' },
    'to-read': { bg: '#DBEAFE', text: '#1E40AF' },
  };

  const statusLabels = {
    reading: "Leyendo",
    completed: "Completado",
    "to-read": "Por leer",
  };

  const statusStyle = statusColors[book.status];

  return (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.bookContent}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>
          {book.startDate && book.status !== "to-read" && (
            <Text style={styles.bookDate}>
              {book.status === "reading" ? "Desde: " : "Leído: "}
              {new Date(book.startDate).toLocaleDateString()}
              {book.endDate && ` - ${new Date(book.endDate).toLocaleDateString()}`}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusLabels[book.status]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Componente para mostrar mensajes cuando no hay libros
const EmptyState = ({ status = "all", onPress }) => {
  const messages = {
    all: "No se encontraron libros",
    reading: "No tienes libros en lectura",
    completed: "No tienes libros completados",
    "to-read": "No tienes libros por leer",
  };

  const descriptions = {
    all: "Agrega tu primer libro para comenzar a rastrear tu lectura",
    reading: "Agrega un libro en esta categoría para comenzar",
    completed: "Agrega un libro en esta categoría para comenzar",
    "to-read": "Agrega un libro en esta categoría para comenzar",
  };

  const icons = {
    all: "book",
    reading: "book-open",
    completed: "check-circle",
    "to-read": "bookmark"
  };

  return (
    <View style={styles.emptyContainer}>
      <Feather name={icons[status]} size={48} color="#D1D5DB" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{messages[status]}</Text>
      <Text style={styles.emptyDescription}>{descriptions[status]}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onPress}>
        <Feather name="plus" size={16} color="#FFFFFF" style={styles.emptyButtonIcon} />
        <Text style={styles.emptyButtonText}>Agregar libro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 12,
    alignItems: 'center',
  },
  addIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#059669',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#059669',
    fontWeight: '500',
  },
  booksList: {
    padding: 16,
  },
  bookCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addBookButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addBookButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DashboardScreen;