import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Datos de ejemplo
const mockBooks = [
  {
    id: 1,
    title: "Cien años de soledad",
    author: "Gabriel García Márquez",
    status: "completed",
    startDate: "2023-01-15",
    endDate: "2023-02-20",
    comment: "Una obra maestra de la literatura latinoamericana.",
  },
  {
    id: 2,
    title: "El señor de los anillos",
    author: "J.R.R. Tolkien",
    status: "reading",
    startDate: "2023-03-10",
    endDate: null,
    comment: "Fascinante mundo de fantasía.",
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    status: "to-read",
    startDate: null,
    endDate: null,
    comment: "",
  },
  {
    id: 4,
    title: "Don Quijote de la Mancha",
    author: "Miguel de Cervantes",
    status: "completed",
    startDate: "2022-11-05",
    endDate: "2023-01-10",
    comment: "Clásico imprescindible de la literatura española.",
  },
  {
    id: 5,
    title: "Harry Potter y la piedra filosofal",
    author: "J.K. Rowling",
    status: "reading",
    startDate: "2023-04-20",
    endDate: null,
    comment: "Relectura del primer libro de la saga.",
  },
];

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredBooks = mockBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const readingBooks = filteredBooks.filter((book) => book.status === "reading");
  const completedBooks = filteredBooks.filter((book) => book.status === "completed");
  const toReadBooks = filteredBooks.filter((book) => book.status === "to-read");

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

  const renderBookCard = ({ item }) => (
    <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })} />
  );

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
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
            onPress={() => navigation.navigate('NewBook')}
          >
            <Feather name="plus" size={16} color="#FFFFFF" style={styles.addIcon} />
            <Text style={styles.addButtonText}>Nuevo libro</Text>
          </TouchableOpacity>
        </View>

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

        {getDisplayBooks().length > 0 ? (
          <FlatList
            data={getDisplayBooks()}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.booksList}
          />
        ) : (
          <EmptyState status={activeTab} onPress={() => navigation.navigate('NewBook')} />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

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

  return (
    <View style={styles.emptyContainer}>
      <Feather name="book-open" size={48} color="#D1D5DB" style={styles.emptyIcon} />
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
    paddingHorizontal: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DashboardScreen;