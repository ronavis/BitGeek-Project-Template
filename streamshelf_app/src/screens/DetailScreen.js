/**
 * DetailScreen.js
 * 
 * Detail view for movies and TV shows, showing comprehensive information
 * about the selected content along with streaming availability.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  SafeAreaView,
  Linking,
  Platform
} from 'react-native';
import { getContentDetails, getCredits, getVideos } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../themes';
import { useWatchlist } from '../context/WatchlistContext'; // Import watchlist hook

/**
 * Screen that displays detailed information about a movie or TV show
 * 
 * @param {Object} route - React Navigation route object containing params
 * @param {Object} navigation - React Navigation navigation object
 * @returns {JSX.Element} DetailScreen component
 */
export default function DetailScreen({ route, navigation }) {
  // Get parameters from route
  const { itemId, contentType = 'movie' } = route.params;
  const { theme } = useTheme();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist(); // Add watchlist hooks
  
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for video pagination
  const [currentVideoPage, setCurrentVideoPage] = useState(0);
  const videosPerPage = 3; // Show 3 videos per page
  
  // Check if the item is in the watchlist
  const inWatchlist = isInWatchlist(itemId);

  /**
   * Toggle watchlist status for this content
   */
  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(itemId);
    } else if (details) {
      addToWatchlist({
        id: details.id,
        title: details.title || details.name,
        posterPath: details.poster_path,
        contentType: contentType,
        overview: details.overview,
        releaseDate: details.release_date || details.first_air_date
      });
    }
  };
  
  /**
   * Handles going to the next page of videos
   */
  const nextVideoPage = () => {
    if ((currentVideoPage + 1) * videosPerPage < videos.length) {
      setCurrentVideoPage(currentVideoPage + 1);
    }
  };
  
  /**
   * Handles going to the previous page of videos
   */
  const prevVideoPage = () => {
    if (currentVideoPage > 0) {
      setCurrentVideoPage(currentVideoPage - 1);
    }
  };

  /**
   * Fetch content details when screen loads or parameters change
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch details, credits, and videos in parallel
        const [contentDetails, contentCredits, contentVideos] = await Promise.all([
          getContentDetails(itemId, contentType),
          getCredits(itemId, contentType),
          getVideos(itemId, contentType)
        ]);
        
        setDetails(contentDetails);
        setCredits(contentCredits);
        setVideos(contentVideos);
      } catch (error) {
        console.error('Failed to fetch content data:', error);
        setError('Failed to load content details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [itemId, contentType]);

  /**
   * Navigate to a recommended content item
   * 
   * @param {number} recId - ID of the recommended content
   * @param {string} recType - Type of content (movie/tv)
   */
  const handleRecommendationPress = (recId, recType = contentType) => {
    // Navigate to DetailScreen with new ID (replaces current screen in stack)
    navigation.push('Detail', { itemId: recId, contentType: recType });
  };

  /**
   * Opens a YouTube video in the user's default browser or YouTube app
   * 
   * @param {string} url - The YouTube URL to open
   */
  const openVideo = async (url) => {
    try {
      // Check if the URL can be opened on the device
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening video URL:', error);
    }
  };

  /**
   * Renders a streaming service logo item
   * 
   * @param {Object} item - Streaming provider data
   * @returns {JSX.Element} Rendered streaming provider item
   */
  const renderProviderItem = ({ item }) => (
    <View style={[styles.providerItem, { backgroundColor: theme.colors.card }]}>
      {item.logo ? (
        <Image 
          source={{ uri: item.logo }} 
          style={styles.providerLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.providerPlaceholder, { backgroundColor: theme.colors.border }]}>
          <Text style={[styles.providerPlaceholderText, { color: theme.colors.text }]}>{item.name}</Text>
        </View>
      )}
      <Text style={[styles.providerName, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.name}</Text>
    </View>
  );

  /**
   * Renders a recommendation item
   * 
   * @param {Object} item - Recommendation data
   * @returns {JSX.Element} Rendered recommendation item
   */
  const renderRecommendationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recommendationItem}
      onPress={() => handleRecommendationPress(item.id)}
    >
      {item.posterPath ? (
        <Image 
          source={{ uri: item.posterPath }} 
          style={styles.recommendationPoster}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.noPoster, { backgroundColor: theme.colors.border }]}>
          <Text style={[styles.noPosterText, { color: theme.colors.text }]}>{item.title}</Text>
        </View>
      )}
      <Text style={[styles.recommendationTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  /**
   * Renders a cast member item
   * 
   * @param {Object} item - Cast member data
   * @returns {JSX.Element} Rendered cast member item
   */
  const renderCastItem = ({ item }) => (
    <View style={styles.castItem}>
      {item.profilePath ? (
        <Image 
          source={{ uri: item.profilePath }} 
          style={styles.castProfile}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.noProfile, { backgroundColor: theme.colors.border }]}>
          <Ionicons name="person" size={30} color={theme.colors.textSecondary} />
        </View>
      )}
      <Text style={[styles.castName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.characterName, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.character}</Text>
    </View>
  );

  /**
   * Renders a video/trailer item
   * 
   * @param {Object} item - Video data
   * @returns {JSX.Element} Rendered video item
   */
  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => openVideo(item.url)}
    >
      <View style={styles.videoThumbnailContainer}>
        <Image 
          source={{ uri: item.thumbnailUrl }} 
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
        <View style={styles.playIconContainer}>
          <Ionicons name="play-circle" size={40} color="white" />
        </View>
      </View>
      <Text style={[styles.videoTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.name}</Text>
      <Text style={[styles.videoType, { color: theme.colors.textSecondary }]}>{item.type}</Text>
    </TouchableOpacity>
  );

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.text,
    },
    infoText: {
      color: theme.colors.textSecondary,
    },
    ratingContainer: {
      backgroundColor: theme.colors.primary,
    },
    ratingText: {
      color: theme.name === 'dark' ? theme.colors.text : '#212529',
    },
    genreTag: {
      backgroundColor: theme.colors.surface,
    },
    genreText: {
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      color: theme.colors.text,
    },
    overview: {
      color: theme.colors.text,
    },
    backButton: {
      backgroundColor: `${theme.colors.surface}DD`,
    },
    backButtonText: {
      color: theme.colors.text,
    },
    crewInfo: {
      color: theme.colors.textSecondary,
    },
    watchlistButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 5,
      borderColor: theme.colors.primary,
      borderWidth: 1,
    },
    watchlistButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
  };

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <View style={[styles.centered, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={dynamicStyles.title}>Loading content details...</Text>
      </View>
    );
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <View style={[styles.centered, dynamicStyles.container]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No details were found
  if (!details) {
    return (
      <View style={[styles.centered, dynamicStyles.container]}>
        <Text style={styles.errorText}>Content details not found.</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get the directors and writers from the crew data
  const directors = credits?.crew?.filter(person => person.job === 'Director') || [];
  const writers = credits?.crew?.filter(person => 
    ['Writer', 'Screenplay'].includes(person.job)
  ) || [];
  
  // Get paginated videos
  const startIndex = currentVideoPage * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const paginatedVideos = videos.slice(startIndex, endIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={theme.name === 'dark' || theme.name === 'retro' ? 'light-content' : 'dark-content'} />
      <ScrollView>
        {/* Backdrop image */}
        {details.backdropPath && (
          <Image
            source={{ uri: details.backdropPath }}
            style={styles.backdrop}
            resizeMode="cover"
          />
        )}

        <View style={[styles.contentContainer, dynamicStyles.contentContainer]}>
          {/* Title and basic info */}
          <Text style={[styles.title, dynamicStyles.title]}>{details.title}</Text>
          
          <View style={styles.infoRow}>
            {details.releaseDate && (
              <Text style={[styles.infoText, dynamicStyles.infoText]}>
                {new Date(details.releaseDate).getFullYear()}
              </Text>
            )}
            
            {details.runtime && (
              <Text style={[styles.infoText, dynamicStyles.infoText]}>
                {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
              </Text>
            )}
            
            {details.voteAverage > 0 && (
              <View style={[styles.ratingContainer, dynamicStyles.ratingContainer]}>
                <Text style={[styles.ratingText, dynamicStyles.ratingText]}>
                  ★ {details.voteAverage.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Genres */}
          {details.genres && details.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {details.genres.map(genre => (
                <View key={genre.id} style={[styles.genreTag, dynamicStyles.genreTag]}>
                  <Text style={[styles.genreText, dynamicStyles.genreText]}>{genre.name}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Watchlist Button */}
          <TouchableOpacity
            style={[
              styles.watchlistButton,
              { 
                backgroundColor: inWatchlist ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.primary,
                borderWidth: 1,
              }
            ]}
            onPress={toggleWatchlist}
          >
            <Ionicons
              name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={inWatchlist ? 'white' : theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.watchlistButtonText,
                { color: inWatchlist ? 'white' : theme.colors.primary }
              ]}
            >
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </Text>
          </TouchableOpacity>

          {/* Trailers/Videos Section */}
          {videos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Trailers & Videos</Text>
                {totalPages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        { opacity: currentVideoPage > 0 ? 1 : 0.5 }
                      ]}
                      onPress={prevVideoPage}
                      disabled={currentVideoPage === 0}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={theme.colors.text}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.paginationText, { color: theme.colors.text }]}>
                      {currentVideoPage + 1}/{totalPages}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        { opacity: (currentVideoPage + 1) < totalPages ? 1 : 0.5 }
                      ]}
                      onPress={nextVideoPage}
                      disabled={(currentVideoPage + 1) >= totalPages}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <FlatList
                data={paginatedVideos}
                renderItem={renderVideoItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listContainer}
              />
            </View>
          )}

          {/* Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Overview</Text>
            <Text style={[styles.overview, dynamicStyles.overview]}>{details.overview || 'No overview available.'}</Text>
          </View>
          
          {/* Credits/Cast Section */}
          {credits && credits.cast && credits.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Cast</Text>
              <FlatList
                data={credits.cast}
                renderItem={renderCastItem}
                keyExtractor={item => `${item.id}-${item.order}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listContainer}
              />
            </View>
          )}

          {/* Crew Info (Directors, Writers) */}
          <View style={styles.section}>
            {directors.length > 0 && (
              <View style={styles.crewSection}>
                <Text style={[styles.crewTitle, { color: theme.colors.text }]}>Director{directors.length > 1 ? 's' : ''}</Text>
                <Text style={[styles.crewInfo, dynamicStyles.crewInfo]}>
                  {directors.map(d => d.name).join(', ')}
                </Text>
              </View>
            )}
            
            {writers.length > 0 && (
              <View style={styles.crewSection}>
                <Text style={[styles.crewTitle, { color: theme.colors.text }]}>Writer{writers.length > 1 ? 's' : ''}</Text>
                <Text style={[styles.crewInfo, dynamicStyles.crewInfo]}>
                  {writers.map(w => w.name).join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* Streaming providers */}
          {details.streamingProviders && details.streamingProviders.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Available on</Text>
              <FlatList
                data={details.streamingProviders}
                renderItem={renderProviderItem}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listContainer}
              />
            </View>
          )}

          {/* Recommendations */}
          {details.recommendations && details.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>You might also like</Text>
              <FlatList
                data={details.recommendations}
                renderItem={renderRecommendationItem}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listContainer}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Back button floating at top */}
      <TouchableOpacity
        style={[styles.backButton, dynamicStyles.backButton]}
        onPress={() => {
          // Enhanced navigation handling
          try {
            console.log('Back button pressed, navigating back');
            navigation.goBack();
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback navigation if goBack fails
            navigation.navigate('Home');
          }
        }}
      >
        <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>←</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    width: '100%',
    height: 220,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginRight: 20,
  },
  ratingContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  genreTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    marginHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  overview: {
    fontSize: 15,
    lineHeight: 22,
  },
  providerItem: {
    marginRight: 16,
    alignItems: 'center',
    width: 80,
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
  },
  providerPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerPlaceholderText: {
    fontSize: 10,
    textAlign: 'center',
  },
  providerName: {
    fontSize: 12,
    textAlign: 'center',
  },
  recommendationItem: {
    marginRight: 12,
    width: 120,
  },
  recommendationPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  noPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  noPosterText: {
    padding: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  castItem: {
    marginRight: 12,
    width: 100,
    alignItems: 'center',
  },
  castProfile: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 6,
  },
  noProfile: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  castName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  characterName: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  videoItem: {
    marginRight: 16,
    width: 200,
  },
  videoThumbnailContainer: {
    position: 'relative',
    width: 200,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  videoType: {
    fontSize: 11,
    marginTop: 2,
  },
  crewSection: {
    marginBottom: 12,
  },
  crewTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  crewInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContainer: {
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
    } : {
      elevation: 3,
    }),
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  watchlistButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 1px 1.5px rgba(0, 0, 0, 0.2)',
  },
}); 