import { db, firebaseTimestamp, auth } from './firebase';

// Referencias a colecciones en la base de datos
const booksCollection = db.collection('books');
const statsCollection = db.collection('readingStats');

// Obtener el ID del usuario actual
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  return user.uid;
};

// Obtener todos los libros del usuario actual
export const getUserBooks = async () => {
  try {
    const userId = getCurrentUserId();
    
    try {
      // Intentar obtener libros ordenados por fecha de creación
      const snapshot = await booksCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return books;
    } catch (indexError) {
      // En caso de error con índices, hacer consulta sin ordenar
      if (indexError.code === 'failed-precondition' || indexError.message.includes('requires an index')) {
        console.warn('Error de índice, usando consulta sin ordenar:', indexError.message);
        
        const fallbackSnapshot = await booksCollection
          .where('userId', '==', userId)
          .get();
        
        return fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        throw indexError;
      }
    }
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.code === 'permission-denied') {
      console.error('Error de permisos:', error);
      throw new Error('No tienes permisos para esta acción');
    } else if (error.code === 'unavailable') {
      console.error('Error de conexión:', error);
      throw new Error('Error de conexión. Verifica tu internet');
    } else {
      console.error('Error al obtener libros:', error);
      throw error;
    }
  }
};

// Obtener un libro específico por su ID
export const getBookById = async (bookId) => {
  try {
    const userId = getCurrentUserId();
    const doc = await booksCollection.doc(bookId).get();
    
    if (!doc.exists) {
      throw new Error('Libro no encontrado');
    }
    
    const bookData = doc.data();
    
    // Verificar que el libro pertenezca al usuario actual
    if (bookData.userId !== userId) {
      throw new Error('No tienes permiso para ver este libro');
    }
    
    return {
      id: doc.id,
      ...bookData
    };
  } catch (error) {
    console.error('Error al obtener el libro:', error);
    throw error;
  }
};

// Agregar un nuevo libro
export const addBook = async (bookData) => {
  try {
    const userId = getCurrentUserId();
    
    // Agregar metadatos al libro
    const bookWithMetadata = {
      ...bookData,
      userId,
      createdAt: firebaseTimestamp(),
      updatedAt: firebaseTimestamp()
    };
    
    // Guardar libro en la base de datos
    const docRef = await booksCollection.add(bookWithMetadata);
    
    // Actualizar estadísticas de lectura
    await updateReadingStats(userId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error al añadir libro:', error);
    throw error;
  }
};

// Actualizar un libro existente
export const updateBook = async (bookId, bookData) => {
  try {
    const userId = getCurrentUserId();
    
    // Verificar que el libro pertenezca al usuario actual
    const bookDoc = await booksCollection.doc(bookId).get();
    
    if (!bookDoc.exists) {
      throw new Error('Libro no encontrado');
    }
    
    const existingBook = bookDoc.data();
    if (existingBook.userId !== userId) {
      throw new Error('No tienes permiso para editar este libro');
    }
    
    // Actualizar libro con nuevos datos
    await booksCollection.doc(bookId).update({
      ...bookData,
      updatedAt: firebaseTimestamp()
    });
    
    // Actualizar estadísticas de lectura
    await updateReadingStats(userId);
    
    return bookId;
  } catch (error) {
    console.error('Error al actualizar libro:', error);
    throw error;
  }
};

// Eliminar un libro
export const deleteBook = async (bookId) => {
  try {
    const userId = getCurrentUserId();
    
    // Verificar que el libro pertenezca al usuario actual
    const bookDoc = await booksCollection.doc(bookId).get();
    
    if (!bookDoc.exists) {
      throw new Error('Libro no encontrado');
    }
    
    const existingBook = bookDoc.data();
    if (existingBook.userId !== userId) {
      throw new Error('No tienes permiso para eliminar este libro');
    }
    
    // Eliminar el libro
    await booksCollection.doc(bookId).delete();
    
    // Actualizar estadísticas de lectura
    await updateReadingStats(userId);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar libro:', error);
    throw error;
  }
};

// Actualizar estadísticas de lectura del usuario
export const updateReadingStats = async (userId) => {
  try {
    if (!userId) {
      userId = getCurrentUserId();
    }
    
    // Obtener todos los libros del usuario
    const snapshot = await booksCollection
      .where('userId', '==', userId)
      .get();
    
    const books = snapshot.docs.map(doc => doc.data());
    
    // Calcular estadísticas
    const total = books.length;
    const reading = books.filter(book => book.status === 'reading').length;
    const completed = books.filter(book => book.status === 'completed').length;
    const toRead = books.filter(book => book.status === 'to-read').length;
    
    // Actualizar estadísticas en la base de datos
    await statsCollection.doc(userId).set({
      total,
      reading,
      completed,
      toRead,
      lastUpdated: firebaseTimestamp()
    }, { merge: true });
    
    return { total, reading, completed, toRead };
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    throw error;
  }
};

// Obtener estadísticas de lectura del usuario actual
export const getUserReadingStats = async () => {
  try {
    const userId = getCurrentUserId();
    const doc = await statsCollection.doc(userId).get();
    
    if (!doc.exists) {
      // Si no existen estadísticas, calcularlas
      return await updateReadingStats(userId);
    }
    
    return doc.data();
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};