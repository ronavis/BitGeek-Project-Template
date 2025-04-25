/**
 * CatalogScreen.js
 * 
 * Displays the content catalog from user's selected streaming services.
 * Presents movies/shows in a grid layout resembling physical shelves in a video store.
 * 
 * Related ticket: SS-008 - Video store shelf layout
 */

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Platform,
  Alert,
  RefreshControl,
  TouchableWithoutFeedback,
  Pressable,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { useSubscriptions } from '../context/SubscriptionContext';
import { fetchCatalog, searchContent } from '../utils/api';
import { debounce } from 'lodash';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, THEMES } from '../themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionContext } from '../context/SubscriptionContext';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import NoResultsMessage from '../components/NoResultsMessage';
import SafeImage from '../components/SafeImage';  // Import SafeImage component
import ShelfDivider from '../components/ShelfDivider'; // Import the dedicated ShelfDivider component
import SegmentedButtons from '../components/SegmentedButtons';

// Get screen dimensions to calculate grid columns
const { width, height } = Dimensions.get('window');

// Calculate number of columns based on screen width
// For phones: 3 columns, For tablets/larger screens: 4-5 columns
const getNumColumns = () => {
  return width < 600 ? 3 : width < 960 ? 4 : 5;
};

// Helper function to get shelf backing color based on theme
const getShelfBackingColor = (theme, currentTheme) => {
  if (currentTheme === 'retro') {
    return '#A87328'; // Wood color for retro theme
  }
  return theme.colors.card;
};

// Helper function to get shelf edge color based on theme
const getShelfEdgeColor = (theme, currentTheme) => {
  if (currentTheme === 'retro') {
    return '#8B5A2B'; // Darker wood color for retro theme
  }
  return theme.colors.border;
};

// Constants
const CONTENT_TYPES = ['movie', 'tv'];
const SHELF_SIZE_KEY = 'shelfSizePreference';
const DEFAULT_SHELF_SIZE = 5;
const MIN_SHELF_SIZE = 5;
const MAX_SHELF_SIZE = 5;

/**
 * Generates mock catalog data for testing purposes
 * @param {number} count Number of mock items to generate
 * @returns {Array} Array of mock catalog items
 */
const generateMockData = (count = 20) => {
  // Real movie poster URLs that work reliably
  const moviePosters = [
    "/qhb1qOilapbapxWQn9jtRCMwXJF.jpg", // Avengers: Infinity War
    "/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg", // The Lion King
    "/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg", // Star Wars
    "/qAwFbszz0kMyVlwF9eTR3zQde2A.jpg", // Batman v Superman
    "/kqjL17yufvn9OVLyXYpvtyrFfak.jpg", // Mad Max
    "/pU1ULUq8D3iRxl1fdX2lZIzdHuI.jpg", // Joker
    "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", // Avengers
    "/sFC1ElvoKGdHJIWRpNB3xWJ9lJA.jpg", // The Dark Knight
    "/nGL2FKinDqa7_gJZI26PnK5erEX.jpg", // Dune
    "/xBHvZcjRiWyobQ9kxBhO6B2dtRI.jpg", // Avatar
    "/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg", // Interstellar
    "/5KlRFKKSbyCiyYpZSS3A6G5bW0K.jpg", // Inception
    "/tnAuB8q5vv7Ax9UAEje5Xi4BXik.jpg", // Avatar 2
    "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", // The Avengers
    "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", // Thor
    "/6KErczPBROQty7QoIsaa6wJYXZi.jpg", // Black Panther
    "/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", // Fight Club
    "/sav0jxYqGiYHZhl5lPW0r5MN8qP.jpg", // Parasite
    "/velWPhVMQeQKcxggNEU8YmIo52R.jpg", // Harry Potter
    "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", // The Shawshank Redemption
  ];

  // Create movie titles based on genres
  const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Horror", 
    "Sci-Fi", "Fantasy", "Thriller", "Romance", "Mystery"
  ];

  return Array.from({ length: count }, (_, i) => {
    const genreIndex = Math.floor(Math.random() * genres.length);
    const genre = genres[genreIndex];
    const index = Math.floor(Math.random() * moviePosters.length);
    
    return {
      id: `mock-${i}`,
      title: `${genre} Movie ${i + 1}`,
      overview: 'This is a mock movie item for testing the UI when API data is unavailable.',
      // Use real TMDB poster paths
      posterPath: moviePosters[index],
      backdropPath: moviePosters[index],
      releaseDate: '2023-01-01',
      voteAverage: (Math.random() * 5 + 5).toFixed(1), // Random rating between 5.0-10.0
      mediaType: 'movie',
      genre_ids: [genreIndex + 1]
    };
  });
};

/**
 * Groups catalog items into shelves
 * 
 * @param {Array} items - Catalog items to group
 * @param {number} shelfSize - Number of items per shelf
 * @returns {Array} Array of shelves, each containing items
 */
const groupIntoShelves = (items, shelfSize) => {
  if (!items || items.length === 0) {
    console.log('No items to group into shelves');
    return [];
  }
  
  console.log('Grouping', items.length, 'items into shelves of size', shelfSize);
  
  // Shelf categories/genres for organization
  const shelfTitles = [
    "New Releases",
    "Staff Picks", 
    "Top Rated",
    "Action & Adventure",
    "Sci-Fi & Fantasy",
    "Drama",
    "Comedy",
    "Horror",
    "Family Favorites"
  ];
  
  // Create shelves with proper format for rendering
  const shelves = [];
  for (let i = 0; i < items.length; i += shelfSize) {
    const shelfItems = items.slice(i, i + shelfSize);
    const shelfIndex = Math.min(Math.floor(i / shelfSize), shelfTitles.length - 1);
    
    shelves.push({
      id: `shelf-${shelfIndex}`,
      title: shelfTitles[shelfIndex],
      content: shelfItems
    });
  }
  console.log('Created', shelves.length, 'shelves');
  return shelves;
};

// Add this utility function to detect if running in a browser with proper hover support
const hasHoverSupport = () => {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 
    window.matchMedia && window.matchMedia('(hover: hover)').matches;
};

// Add a getBracketColor function to ensure brackets are always darker than shelves
const getBracketColor = (backingColor) => {
  // Convert hex to RGB, darken, and convert back to hex
  let r = parseInt(backingColor.substring(1, 3), 16);
  let g = parseInt(backingColor.substring(3, 5), 16);
  let b = parseInt(backingColor.substring(5, 7), 16);
  
  // Darken by 20%
  r = Math.max(0, Math.floor(r * 0.8));
  g = Math.max(0, Math.floor(g * 0.8));
  b = Math.max(0, Math.floor(b * 0.8));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Component that displays a grid of content from selected streaming services
 * arranged to look like movies on a shelf
 * 
 * @param {Object} navigation - React Navigation navigation object
 * @returns {JSX.Element} CatalogScreen component
 */
export default function CatalogScreen({ navigation }) {
  const { services, isLoading: isLoadingServices } = useSubscriptions();
  const { theme, currentTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [error, setError] = useState(null);
  const [contentType, setContentType] = useState('movie'); // 'movie' or 'tv' or 'multi'
  const [numColumns, setNumColumns] = useState(DEFAULT_SHELF_SIZE);
  const [moviesPerRow] = useState(DEFAULT_SHELF_SIZE);
  
  // Add debug logging for services
  useEffect(() => {
    console.log('Services from context:', services);
  }, [services]);
  
  // Component mount state tracking
  const isMounted = useRef(true);
  
  // Grid layout variables
  const [itemWidth, setItemWidth] = useState(Dimensions.get('window').width / moviesPerRow - 10);
  const [itemHeight, setItemHeight] = useState(180);

  // Constants for AsyncStorage keys
  const SHELF_SIZE_STORAGE_KEY = 'streamshelf_shelf_size';

  // Load saved shelf size preference
  useEffect(() => {
    const loadShelfSizePreference = async () => {
      try {
        const savedSize = await AsyncStorage.getItem(SHELF_SIZE_KEY);
        if (savedSize) {
          setMoviesPerRow(parseInt(savedSize, 10));
        }
      } catch (error) {
        console.error('Error loading shelf size preference:', error);
      }
    };
    
    loadShelfSizePreference();
    loadCatalog();
  }, [contentType]);
  
  // Initial component setup - load test data immediately
  useEffect(() => {
    console.log('Component mounted - loading initial test data');
    setCatalog(generateMockData(15)); // Generate 15 mock items
    setIsLoading(false);
  }, []);
  
  // Add test data automatically in development - keep this as backup
  useEffect(() => {
    // After a short delay, if catalog is still empty and not loading, add test data
    const timer = setTimeout(() => {
      if (catalog.length === 0 && !isLoading) {
        console.log('Loading test data since catalog is empty');
        // Generate mock data with 9 items (3 rows of 3 items)
        setCatalog(generateMockData(9));
      }
    }, 3000); // 3 second delay
    
    return () => clearTimeout(timer);
  }, [catalog, isLoading]);
  
  useEffect(() => {
    // Component mount tracking
    isMounted.current = true;
    
    // Initial catalog load
    loadCatalog();
    
    // Screen dimensions change handler
    const handleDimensionChange = () => {
      const { width } = Dimensions.get('window');
      
      // Calculate item width based on fixed 5 movies per row
      const padding = 20; // Total horizontal padding
      const spacing = 4 * 6; // Spacing between 5 items
      const availableWidth = width - padding - spacing;
      const calculatedWidth = availableWidth / 5;
      
      setItemWidth(calculatedWidth);
      // Set height to maintain a 2:3 aspect ratio (common for movie posters)
      setItemHeight(calculatedWidth * 1.5); 
      setNumColumns(5);
    };
    
    // Add dimension change listener
    const subscription = Dimensions.addEventListener('change', handleDimensionChange);
    
    // Initial dimension setup
    handleDimensionChange();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [services]); // Removed moviesPerRow dependency since it's now fixed

  /**
   * Set up navigation header to show current theme
   */
  useLayoutEffect(() => {
    // Get theme icon and text
    let themeIcon;
    let themeName;
    
    switch (currentTheme) {
      case THEMES.DARK:
        themeIcon = 'moon';
        themeName = 'Dark';
        break;
      case THEMES.RETRO:
        themeIcon = 'videocam';
        themeName = 'Retro';
        break;
      case THEMES.LIGHT:
      default:
        themeIcon = 'sunny';
        themeName = 'Light';
    }
    
    navigation.setOptions({
      headerRight: () => (
        <View style={[styles.headerIndicator, {
          backgroundColor: currentTheme === THEMES.RETRO ? '#FFCC00' : theme.colors.background,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16
        }]}>
          <Text style={[styles.themeBadge, { 
            color: currentTheme === THEMES.RETRO ? '#0033AA' : theme.colors.primary,
            fontSize: 14,
            fontWeight: '700'
          }]}>
            {themeName}
          </Text>
        </View>
      ),
    });
  }, [navigation, currentTheme, theme]);

  /**
   * Load catalog data on component mount and when services change
   */
  useEffect(() => {
    // Check if API key and services are available
    console.log('Services changed, currently selected:', services);
    
    // Only fetch if we have services and aren't currently searching
    if (services.length > 0 && !isSearching) {
      loadCatalog();
    } else if (services.length === 0) {
      setIsLoading(false);
      setCatalog([]);
      setError('Please select at least one streaming service in your profile.');
    }
  }, [services, contentType]); // Re-fetch when services or content type changes

  /**
   * Fetches the catalog from TMDb API
   */
  const loadCatalog = async () => {
    if (services.length === 0) {
      if (isMounted.current) {
        console.log('No services selected, showing empty state');
        setCatalog([]);
        setIsLoading(false);
        setError('Please select at least one streaming service in your profile.');
      }
      return;
    }

    console.log('Loading catalog with services:', services, 'contentType:', contentType);
    setIsLoading(true);
    setError(null);
    setSearchError(null);
    setPage(1);
    setHasMoreContent(true);

    try {
      let data;
      if (searchQuery.trim() !== '') {
        setIsSearching(true);
        console.log('Searching for:', searchQuery, 'in content type:', contentType);
        data = await searchContent(searchQuery, contentType, services);
      } else {
        setIsSearching(false);
        console.log('Fetching catalog with services:', services);
        data = await fetchCatalog(services, contentType);
        console.log('API returned data:', data ? data.length : 0, 'items');
        if (!data || data.length === 0) {
          console.log('No data returned from API, using test data');
          data = generateMockData(9);
        }
      }
      
      console.log('API responded with', data ? data.length : 0, 'items');
      
      // Check if we got an error placeholder item
      const hasErrorItem = data && data.length === 1 && data[0].isError;
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setCatalog(data || []);
        
        if (hasErrorItem) {
          setError(data[0].overview || 'Error fetching content. Please try again.');
        } else {
          setHasMoreContent((data || []).length >= 20);
        }
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
      // Only update state if component is still mounted
      if (isMounted.current) {
        console.log('Error occurred, using test data');
        setError('Failed to load content from API. Showing test data instead.');
        setCatalog(generateMockData(9)); // Use mock data on error
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handles loading more content when scrolling
   */
  const loadMoreContent = async () => {
    if (isLoadingMore || !hasMoreContent || isSearching) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      const results = await fetchCatalog(
        services,
        contentType,
        nextPage
      );
      
      if (results && results.length > 0) {
        // Filter out any duplicates that might be in the new results
        const newItems = results.filter(newItem => 
          !catalog.some(existingItem => existingItem && newItem && existingItem.id === newItem.id)
        );
        
        if (newItems.length > 0) {
          setCatalog(prev => [...prev, ...newItems]);
          setPage(nextPage);
        } else {
          setHasMoreContent(false);
        }
      } else {
        setHasMoreContent(false);
      }
    } catch (err) {
      console.error('Error loading more content:', err);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Handles search input changes and triggers search API
   * @param {string} text - The search query
   */
  const handleSearch = useCallback(
    debounce(async (text) => {
      if (!text.trim()) {
        setIsSearching(false);
        loadCatalog();
        return;
      }

      setIsSearching(true);
      setIsLoading(true);
      setSearchError(null);
      setError(null);

      try {
        // Search content with the search query, content type and services filter
        const searchType = contentType === 'multi' ? 'multi' : contentType;
        const results = await searchContent(text, searchType, services);
        
        if (results.length === 0) {
          // No results found but this isn't an error
          setCatalog([]);
        } else {
          setCatalog(results);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Failed to search. Please try again.');
        setCatalog([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [contentType, services]
  );

  /**
   * Updates search query and triggers search
   */
  const onSearchChange = (text) => {
    setSearchQuery(text);
    handleSearch(text);
  };

  /**
   * Clears the search and returns to regular catalog view
   */
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchError(null);
    loadCatalog();
  };

  /**
   * Toggles between Movies, TV Shows, and Both
   */
  const toggleContentType = () => {
    // Cycle through content types: movie -> tv -> multi -> movie
    if (contentType === 'movie') {
      setContentType('tv');
    } else if (contentType === 'tv') {
      setContentType('multi');
    } else {
      setContentType('movie');
    }
    
    // Clear search if active
    if (isSearching && searchQuery) {
      // Maintain the search query but re-search with new content type
      handleSearch(searchQuery);
    }
  };
  
  // Updated renderShelfItem to fix the blue space issue around posters
  const renderShelfItem = ({ item }) => {
    if (!item) {
      // Return an empty shelf space that looks better
      return (
        <View style={[
          styles.placeholderItem, 
          { width: Dimensions.get('window').width / moviesPerRow - 16 }
        ]}>
          {hasHoverSupport() && <View style={styles.placeholderDust} />}
        </View>
      );
    }
    
    // Get the title based on content type
    const title = item.title || item.name || 'Untitled';
    
    // For web, add hover class using CSS-in-JS if supported
    const webHoverStyles = hasHoverSupport() ? {
      '&:hover': {
        transform: 'perspective(1000px) rotateY(5deg) scale(1.05) translateY(-10px)',
        zIndex: 10,
        boxShadow: '3px 10px 15px rgba(0, 0, 0, 0.5)',
      },
      '&:hover .posterImage': {
        opacity: 0.9,
      }
    } : {};
    
    // Use fallback colors based on current theme
    const fallbackColor = '#333333'; // Dark gray for fallback
    
    return (
      <TouchableOpacity
        style={[
          styles.shelfItem, 
          { width: Dimensions.get('window').width / moviesPerRow - 16 },
          Platform.OS === 'web' ? webHoverStyles : {}
        ]}
        onPress={() => navigation.navigate('Detail', { 
          itemId: item.id, 
          contentType: item.contentType || item.mediaType || contentType 
        })}
        activeOpacity={0.7} // Add a slight opacity change on press
      >
        <View style={styles.posterContainer}>
          <SafeImage
            source={item.posterPath ? 
              { uri: `https://image.tmdb.org/t/p/w200${item.posterPath}` } : 
              { uri: 'https://via.placeholder.com/200x300?text=No+Image' }
            }
            style={[styles.posterImage, Platform.OS === 'web' ? { className: 'posterImage' } : {}]}
            resizeMode="cover" // Changed to cover to fill the container
            fallbackColor={fallbackColor}
          />
        </View>
        
        {/* Enhanced shadow beneath the poster to suggest it's sitting on the shelf */}
        <View style={styles.posterShadow} />
        
        {/* Add reflection effect on the shelf surface */}
        {Platform.OS === 'web' && <View style={styles.posterReflection} />}
      </TouchableOpacity>
    );
  };

  // Generate styles using the current theme
  const styles = getStyles(theme, currentTheme);

  // If still loading services, show loading indicator
  if (isLoadingServices) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your subscriptions...</Text>
      </View>
    );
  }

  // Add this below the loadCatalog function
  /**
   * For testing: Logs current setup status
   */
  useEffect(() => {
    console.log("=== StreamShelf Status ===");
    console.log("Selected services:", services);
    console.log("Content type:", contentType);
    console.log("Has mounted ref:", isMounted.current);
    
    if (services.length === 0) {
      console.log("⚠️ NO SERVICES SELECTED - Please click 'Manage Services' to select streaming services");
    }
  }, []);

  // Add this button to the screen for testing only
  const renderTestDataButton = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: '#9c27b0' }]}
          onPress={() => {
            console.log('Loading mock data for testing');
            setCatalog(generateMockData(12));
            setIsLoading(false);
            setError(null);
          }}
        >
          <Text style={styles.buttonText}>Load Test Data</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  // Inside the component, after loading the catalog
  useEffect(() => {
    // Debug log for catalog state
    console.log("Catalog state:", {
      itemCount: catalog.length,
      isLoading,
      hasError: !!error,
      firstItem: catalog.length > 0 ? catalog[0] : null
    });
    
    if (catalog.length > 0) {
      console.log("First item details:", catalog[0]);
    }
  }, [catalog, isLoading, error]);

  // Update the getWallPattern function to take currentTheme as a parameter
  const getWallPattern = (currentTheme) => {
    if (Platform.OS !== 'web') {
      return {}; // Only apply complex patterns on web for performance
    }
    
    // Use theme colors instead of hardcoded values
    const bgColor = currentTheme === THEMES.RETRO
      ? '#0033AA' // Keep Blockbuster blue for retro theme
      : theme.colors.background;
      
    const patternColor = currentTheme === THEMES.RETRO
      ? 'rgba(0, 20, 80, 0.1)'
      : `${theme.colors.border}40`; // Add 40 (25% opacity) to hex color
    
    return {
      backgroundColor: bgColor,
      backgroundImage: `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
    };
  };

  // Update the getWallColor function to take currentTheme as a parameter
  const getWallColor = (currentTheme) => {
    return currentTheme === THEMES.RETRO
      ? '#0033AA' // Blockbuster deep blue for retro theme
      : currentTheme === THEMES.DARK
        ? '#222222' // Dark theme
        : '#f0f0f0'; // Light theme
  };

  // Create a new BetweenRowsShelf component
  const BetweenRowsShelf = ({ theme, currentTheme }) => {
    return (
      <View style={{ 
        width: '100%',
        height: 10,
        backgroundColor: currentTheme === THEMES.RETRO 
          ? '#A87328' // Wood color for retro theme
          : theme.colors.card
      }} />
    );
  };

  // Adjust the renderShelf function to have appropriate spacing
  const renderShelf = useCallback(({ item: shelf }) => {
    // Use the existing theme and currentTheme from the component scope
    // instead of trying to access ThemeContext directly
    
    // Skip rendering empty shelves
    if (!shelf.content || shelf.content.length === 0) {
      return null;
    }

    // Calculate bracket positions based on screen width
    const screenWidth = Dimensions.get('window').width;
    const numBrackets = Math.max(3, Math.floor(screenWidth / 200)); // One bracket every ~200px

    // Generate multiple brackets with improved positioning and smaller size
    const renderBrackets = () => {
      const brackets = [];
      const spacing = screenWidth / (numBrackets + 1);
      
      for (let i = 1; i <= numBrackets; i++) {
        const leftPosition = spacing * i - 10; // Center the bracket (20px width / 2)
        
        // Create an L-shaped bracket with two elements: horizontal and vertical parts
        brackets.push(
          <View key={`bracket-${i}`} style={{ position: 'absolute', left: leftPosition, top: 20 }}>
            {/* Horizontal part of the L-bracket */}
            <View style={styles.shelfBracketHorizontal} />
            
            {/* Vertical part of the L-bracket */}
            <View style={styles.shelfBracketVertical} />
          </View>
        );
      }
      return brackets;
    };

    return (
      <View style={[styles.shelfContainer]}>
        {/* Content on the shelf */}
        <FlatList
          data={shelf.content}
          renderItem={renderShelfItem}
          keyExtractor={(item, index) => `${shelf.id}-${item.id || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.shelfContentContainer,
          ]}
        />
        
        {/* Bracket and shelf container to group them together */}
        <View style={styles.shelfAndBracketContainer}>
          {/* Enhanced shelf with front edge and top surface for more realism */}
          <View>
            {/* Shelf top surface */}
            <View style={styles.shelfBase} />
            
            {/* Centered shelf label card attached to the shelf */}
            <View style={styles.shelfLabelCardContainer}>
              <View style={styles.shelfLabelCard}>
                <Text style={styles.shelfLabelText}>{shelf.title}</Text>
              </View>
            </View>
            
            {/* Shelf front edge - gives depth */}
            <View style={styles.shelfFrontEdge} />
            
            {/* Shelf shadow - cast onto wall */}
            <View style={styles.shelfShadow} />
          </View>
          
          {/* Multiple brackets distributed across the shelf width */}
          {renderBrackets()}
        </View>
      </View>
    );
  }, [moviesPerRow, renderShelfItem, theme, currentTheme]);

  return (
    <SafeAreaView style={[
      styles.container, 
      { 
        backgroundColor: getWallColor(currentTheme),
        ...getWallPattern(currentTheme)
      }
    ]}>
      <StatusBar barStyle={theme.name === 'dark' || theme.name === 'retro' ? 'light-content' : 'dark-content'} />

      {/* Add floor/carpet element */}
      {Platform.OS === 'web' && (
        <View style={styles.floorSection} />
      )}

      {/* Top Bar with Logo */}
      <View style={[styles.topBarContainer, { backgroundColor: theme.colors.header }]}>
        {/* Logo - Using text version only */}
        <View style={styles.logoContainer}>
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoText, { color: theme.colors.headerText }]}>
              StreamShelf
            </Text>
          </View>
        </View>
        
        {/* Empty space where the duplicate title was */}
        <View style={{ flex: 1 }}></View>
        
        {/* Movies/TV toggle with improved contrast */}
        <View style={styles.contentTypeContainer}>
          <SegmentedButtons
            buttons={[
              { value: 'movie', label: 'Movies' },
              { value: 'tv', label: 'TV Shows' },
            ]}
            value={contentType}
            onValueChange={setContentType}
            style={{ backgroundColor: theme.colors.headerControl }}
            theme={{
              colors: {
                primary: theme.colors.primary,
                onSurface: '#FFFFFF', // Changed to white for better contrast
                secondaryContainer: theme.colors.primary, // Use primary color for active button
                onSecondaryContainer: '#FFFFFF', // White text on active button
              }
            }}
          />
        </View>
      </View>

      {/* Search Bar with improved contrast */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          { 
            backgroundColor: currentTheme === THEMES.RETRO ? 
              'rgba(255, 255, 255, 0.9)' : theme.colors.background,
            borderWidth: currentTheme === THEMES.RETRO ? 2 : 0,
            borderColor: currentTheme === THEMES.RETRO ? '#FFCC00' : 'transparent'
          }
        ]}>
          <Text style={[styles.searchIcon, { color: currentTheme === THEMES.RETRO ? '#0033AA' : theme.colors.textSecondary }]}>🔍</Text>
          <TextInput 
            style={[styles.searchInput, { color: currentTheme === THEMES.RETRO ? '#0033AA' : theme.colors.text }]}
            placeholder="Search for movies or shows..."
            placeholderTextColor={currentTheme === THEMES.RETRO ? 'rgba(0, 51, 170, 0.6)' : theme.colors.placeholder}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={[styles.clearButtonText, { color: currentTheme === THEMES.RETRO ? '#0033AA' : theme.colors.textSecondary }]}>✗</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search status indicator */}
      {isSearching && (
        <View style={styles.searchStatusContainer}>
          <Text style={styles.searchStatusText}>
            {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
            {!isLoading && catalog.length > 0 && ` (${catalog.length} found)`}
          </Text>
          {!isLoading && (
            <TouchableOpacity onPress={clearSearch} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Catalog</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error messages */}
      {error && (
        <ErrorMessage message={error} />
      )}
      
      {searchError && (
        <ErrorMessage message={searchError} />
      )}

      {/* No subscriptions message */}
      {services.length === 0 && !isLoading && (
        <EmptyState 
          message="You haven't added any streaming services yet."
          buttonText="Add Services"
          onButtonPress={() => navigation.navigate('Setup')}
        />
      )}

      {/* Content Display Section */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{isSearching ? 'Searching...' : 'Loading content...'}</Text>
          {process.env.NODE_ENV === 'development' && renderTestDataButton()}
        </View>
      ) : catalog.length === 0 && isSearching ? (
        <>
          <NoResultsMessage
            message="No results found for"
            query={searchQuery}
            buttonText="Back to Catalog"
            onButtonPress={clearSearch}
          />
          {process.env.NODE_ENV === 'development' && 
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              {renderTestDataButton()}
            </View>
          }
        </>
      ) : catalog.length === 0 && !isSearching && services.length > 0 ? (
        <>
          <EmptyState
            message="No content available for your selected services and filters."
            buttonText="Manage Services"
            onButtonPress={() => navigation.navigate('Setup')}
          />
          {/* Additional buttons */}
          <View style={{ alignItems: 'center', marginTop: -20 }}>
            <TouchableOpacity
              style={[styles.button, { marginTop: 10 }]}
              onPress={() => loadCatalog()}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
            {renderTestDataButton()}
          </View>
        </>
      ) : (
        <View style={styles.shelfSectionBackdrop}>
          <FlatList
            data={groupIntoShelves(catalog, moviesPerRow)}
            keyExtractor={(_, index) => `shelf-${index}`}
            renderItem={renderShelf}
            contentContainerStyle={styles.contentContainer}
            ListHeaderComponent={<></>}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            ListFooterComponent={
              isLoadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, {marginLeft: 10}]}>Loading more...</Text>
                </View>
              )
            }
            onEndReached={!isSearching ? loadMoreContent : null}
            onEndReachedThreshold={0.5}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * Create styles based on the current theme
 * 
 * @param {Object} theme - Current theme object
 * @param {string} currentTheme - Current theme name (RETRO, DARK, or LIGHT)
 * @returns {Object} Styles for the component
 */
const getStyles = (theme, currentTheme) => {
  const posterShadow = Platform.OS === 'web'
    ? { boxShadow: '2px 4px 8px rgba(0, 0, 0, 0.5)' }
    : {
        elevation: 6,
      };

  // Get shelf colors based on theme - specifically use Blockbuster colors for retro theme
  const shelfBackingColor = currentTheme === THEMES.RETRO
    ? '#FFCC00' // Blockbuster yellow for retro theme
    : theme.colors.card;
  
  const shelfEdgeColor = currentTheme === THEMES.RETRO
    ? '#E5B800' // Darker yellow for retro theme edges
    : theme.colors.border;
    
  // Calculate bracket color (darker than shelf)
  const bracketColor = currentTheme === THEMES.RETRO
    ? '#E5B800' // Darker yellow for retro theme brackets
    : getBracketColor(shelfBackingColor);
  
  // Calculate blue backdrop color for shelves
  const shelfBackdropColor = currentTheme === THEMES.RETRO
    ? '#0033AA' // Blockbuster blue for retro theme
    : currentTheme === THEMES.DARK
      ? '#1e1e1e' // Dark theme 
      : '#e8e8e8'; // Light theme
  
  // Get colors for label cards based on theme
  const labelBgColor = currentTheme === THEMES.RETRO 
    ? '#FFFFFF' // White background for retro theme
    : currentTheme === THEMES.DARK
      ? '#444444' // Darker background for dark theme
      : '#FFFFFF'; // White for light theme
      
  const labelTextColor = currentTheme === THEMES.RETRO
    ? '#0033AA' // Blockbuster blue text for retro
    : currentTheme === THEMES.DARK
      ? '#FFCC00' // Yellow text for dark theme
      : theme.colors.primary; // Theme primary for light
  
  const labelBorderColor = currentTheme === THEMES.RETRO
    ? '#0033AA' // Blue border for retro
    : theme.colors.border;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme === THEMES.RETRO
        ? '#0033AA' // Keep Blockbuster blue for retro theme
        : theme.colors.background,
    },
    contentContainer: {
      paddingTop: 0,
      paddingBottom: Platform.OS === 'web' ? '15%' : 20,
      paddingHorizontal: 0,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    headerIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    themeBadge: {
      fontSize: 12,
      fontWeight: '500',
    },
    loadingText: {
      color: theme.colors.text,
      marginTop: 10,
    },
    searchContainer: {
      padding: 10,
      backgroundColor: theme.colors.surface,
      ...theme.shadow.small,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.name === 'retro' ? theme.colors.surface : theme.colors.background,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: 10,
      borderWidth: theme.name === 'retro' ? 1 : 0,
      borderColor: theme.name === 'retro' ? theme.colors.primary : 'transparent',
    },
    searchIcon: {
      marginRight: 8,
      fontSize: 18,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: theme.colors.text,
    },
    clearButton: {
      padding: 5,
    },
    clearButtonText: {
      color: theme.colors.textSecondary,
    },
    searchStatusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchStatusText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    backButton: {
      padding: 5,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: currentTheme === THEMES.RETRO 
        ? '#002277' // Keep dark blue for retro theme
        : theme.colors.surface,
      borderBottomWidth: 2,
      borderBottomColor: currentTheme === THEMES.RETRO
        ? '#FFCC00' // Keep yellow for retro theme
        : theme.colors.primary,
    },
    toggleText: {
      fontSize: 16,
      color: currentTheme === THEMES.RETRO
        ? '#FFFFFF' // White for retro theme
        : theme.colors.text,
      paddingHorizontal: 10,
    },
    activeToggleText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme === THEMES.RETRO
        ? '#FFCC00' // Yellow for retro theme
        : theme.colors.primary,
      paddingHorizontal: 10,
    },
    errorContainer: {
      padding: 10,
      backgroundColor: theme.name === 'retro' ? theme.colors.card : '#f8d7da',
      borderWidth: 1,
      borderColor: theme.name === 'retro' ? theme.colors.error : '#f5c6cb',
      margin: 10,
      borderRadius: theme.borderRadius.s,
    },
    errorText: {
      color: theme.name === 'retro' ? theme.colors.error : '#721c24',
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    noResultsText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.s,
    },
    buttonText: {
      color: theme.name === 'dark' || theme.name === 'retro' ? theme.colors.text : 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    // New grid and shelf styles
    shelfContainer: {
      padding: 0,
      paddingBottom: 0,
      marginBottom: 0,
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      ...(Platform.OS === 'web' ? {
        transform: 'perspective(1200px) rotateX(1deg)',
        transformOrigin: 'center bottom',
      } : {}),
      position: 'relative',
    },
    shelfHeader: {
      padding: 5,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    shelfTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme === THEMES.RETRO 
        ? '#FFFFFF' 
        : theme.colors.text,
    },
    shelfContentContainer: {
      padding: 0,
      paddingHorizontal: 10,
      paddingBottom: 5,
      paddingLeft: 10,
      backgroundColor: 'transparent',
    },
    emptyShelfText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingMoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    // Shelf size selector styles
    shelfSizeSelectorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    sectionTitle: {
      fontSize: 14,
      marginRight: 10,
      color: '#FFFFFF', // White text for readability
      fontWeight: '500',
    },
    shelfSizeOptions: {
      flexDirection: 'row',
      marginLeft: 5,
    },
    sizeOption: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 5,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    sizeOptionText: {
      fontWeight: 'bold',
      color: '#FFFFFF', // White text for readability
    },
    // New floor/carpet styles
    floorSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '20%',
      zIndex: -1,
      backgroundColor: currentTheme === THEMES.RETRO
        ? '#0033AA' // Keep Blockbuster blue for retro theme
        : theme.colors.background,
      ...(Platform.OS === 'web' ? {
        backgroundImage: currentTheme === THEMES.RETRO
          ? 'linear-gradient(0deg, #002288 0%, #0033AA 100%)'
          : `linear-gradient(0deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
      } : {}),
      borderTopWidth: 1,
      borderTopColor: currentTheme === THEMES.RETRO
        ? '#002288'
        : theme.colors.border,
    },
    // New styles for logo and improved top bar
    topBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 5,
      backgroundColor: currentTheme === THEMES.RETRO
        ? '#002277' // Keep dark blue for retro theme
        : theme.colors.surface,
      borderBottomWidth: 2,
      borderBottomColor: currentTheme === THEMES.RETRO
        ? '#FFCC00' // Keep yellow for retro theme
        : theme.colors.primary,
      height: 90, // Adjusted height for the logo
    },
    logoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      height: 80,
      overflow: 'visible',
      paddingRight: 10,
    },
    logoPlaceholder: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme === THEMES.RETRO
        ? '#FFFFFF' // White for retro theme
        : theme.colors.text,
      letterSpacing: 1,
    },
    logoTextHighlight: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme === THEMES.RETRO
        ? '#FFCC00' // Yellow for retro theme
        : theme.colors.primary,
      letterSpacing: 1,
    },
    logoImage: {
      height: 80,
      width: 192,
      marginLeft: 10,
      marginTop: 5,
    },
    logoTextContainer: {
      height: 80,
      width: 192,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      overflow: 'visible',
    },
    // Shelf item and poster styles
    shelfItem: {
      margin: 8,
      alignItems: 'center',
      position: 'relative',
      height: 200,
      marginBottom: -5,
      paddingBottom: 5,
      width: props => {
        // Calculate width based on moviesPerRow for proper fit
        const baseWidth = (Dimensions.get('window').width / moviesPerRow) - 16;
        return baseWidth;
      },
      ...Platform.OS === 'web' ? {
        transition: 'transform 0.3s ease-in-out, margin-bottom 0.3s ease-in-out',
      } : {},
    },
    placeholderItem: {
      margin: 8,
      height: 180,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 8,
    },
    posterContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
      overflow: 'hidden',
      ...posterShadow,
      backgroundColor: 'transparent',
    },
    posterImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      borderRadius: 8,
    },
    posterShadow: {
      position: 'absolute',
      bottom: -4, // Closer to the bottom of the poster
      left: '15%',
      right: '15%',
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderBottomLeftRadius: 100,
      borderBottomRightRadius: 100,
      zIndex: -1,
      ...(Platform.OS === 'web' ? {
        filter: 'blur(2px)', // Add blur for more realistic shadow
      } : {}),
    },
    placeholderDust: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      backgroundSize: '4px 4px',
    },
    // Add shelf front edge for better depth perception
    shelfFrontEdge: {
      height: 8, // Height of the front edge
      backgroundColor: shelfEdgeColor,
      marginTop: 0, // Connect with the shelf base
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.3)', // Shadow effect
      zIndex: 5,
    },
    
    // Add shelf shadow for depth
    shelfShadow: {
      height: 10,
      marginTop: 0,
      backgroundColor: 'transparent',
      borderBottomLeftRadius: 100,
      borderBottomRightRadius: 100,
      zIndex: 2,
      ...(Platform.OS === 'web' ? {
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.3)',
      } : {
        elevation: 5,
      }),
    },
    
    // Improved horizontal part of the L-bracket - REDUCED SIZE
    shelfBracketHorizontal: {
      width: 20, // Reduced from 40
      height: 4, // Reduced from 8
      backgroundColor: bracketColor, // Use darker color
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: shelfEdgeColor,
      zIndex: 3, // Below the shelf
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: 0.9, // Slightly less visible
    },
    
    // Improved vertical part of the L-bracket - REDUCED SIZE
    shelfBracketVertical: {
      width: 6, // Reduced from 12
      height: 20, // Reduced from 40
      backgroundColor: bracketColor, // Use darker color
      borderWidth: 1,
      borderColor: shelfEdgeColor,
      borderTopWidth: 0,
      zIndex: 3, // Below the shelf
      position: 'absolute',
      top: 4, // Connect with the horizontal part
      left: 7, // Center under the horizontal part
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      opacity: 0.9, // Slightly less visible
      ...(Platform.OS === 'web' ? {
        boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
      } : {
        elevation: 1,
      }),
    },
    
    // Add a container for shelf and brackets to maintain their relationship
    shelfAndBracketContainer: {
      position: 'relative',
      marginTop: 0,
      paddingBottom: 10,
      overflow: 'visible',
    },
    
    // Improved shelf base - add woodgrain effect for retro theme
    shelfBase: {
      height: 15,
      backgroundColor: shelfBackingColor,
      borderTopWidth: 1,
      borderBottomWidth: 0,
      borderColor: shelfEdgeColor,
      marginTop: 0,
      marginBottom: 0,
      zIndex: 5,
      ...(Platform.OS === 'web' && currentTheme === THEMES.RETRO ? {
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 2px, transparent 2px)',
        backgroundSize: '8px 100%',
        ...Platform.select({
          web: {
            background: 'linear-gradient(to right, rgba(0,0,0,0.07) 15px, transparent 15px)',
            backgroundSize: '120px 100%',
            backgroundPosition: '0 0',
          }
        }),
        boxShadow: 'inset 0px 2px 3px rgba(255,255,255,0.2), 0px 3px 5px rgba(0,0,0,0.1)',
      } : Platform.OS === 'web' ? {
        boxShadow: '0px 3px 5px rgba(0,0,0,0.1)',
      } : {
        elevation: 3,
      }),
    },
    
    // Add reflection effect on the shelf surface
    posterReflection: {
      position: 'absolute',
      bottom: -15,
      left: '30%',
      right: '30%',
      height: 10,
      backgroundColor: 'transparent',
      zIndex: 2,
      opacity: 0.1,
      transform: [{ scaleY: -1 }], // Flip vertically for reflection
      ...(Platform.OS === 'web' ? {
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
      } : {}),
    },
    // Add shelf section backdrop to simulate the blue background in Blockbuster displays
    shelfSectionBackdrop: {
      backgroundColor: shelfBackdropColor,
      marginVertical: 0,
      paddingVertical: 5,
      borderTopWidth: currentTheme === THEMES.RETRO ? 2 : 1,
      borderBottomWidth: currentTheme === THEMES.RETRO ? 2 : 1,
      borderColor: currentTheme === THEMES.RETRO ? '#FFCC00' : theme.colors.border,
    },
    // Container to center the label card
    shelfLabelCardContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -10,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    
    // Update shelf label card style to be centered
    shelfLabelCard: {
      backgroundColor: labelBgColor,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 2,
      borderColor: labelBorderColor,
      borderRadius: 3,
      minWidth: 70,
      alignItems: 'center',
      ...(Platform.OS === 'web' ? {
        boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
        transform: 'rotate(-1deg)',
      } : {
        elevation: 3,
        transform: [{rotate: '-1deg'}],
      }),
    },
    
    // Enhanced style for the text inside the label card
    shelfLabelText: {
      color: labelTextColor,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.5,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 
        "'Arial Black', 'Arial', sans-serif" : // More like printed video store labels
        Platform.OS === 'ios' ? 'Arial' : 'sans-serif-black',
      ...(Platform.OS === 'web' ? {
        textTransform: 'uppercase',
      } : {}),
    },
    // New styles for logo and improved top bar
    logo: {
      height: 80,
      width: 192,
      marginLeft: 10,
      marginTop: 5,
    },
    contentTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: currentTheme === THEMES.RETRO 
        ? '#002277' // Keep dark blue for retro theme
        : theme.colors.surface,
      borderBottomWidth: 2,
      borderBottomColor: currentTheme === THEMES.RETRO
        ? '#FFCC00' // Keep yellow for retro theme
        : theme.colors.primary,
    },
  });
};