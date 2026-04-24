import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import feedService, { FeedVideo } from "../services/feedService";
import { AuthContext } from "../context/AuthContext";

const FIGTREE_FONT = "Figtree-Medium";

const { width, height } = Dimensions.get("window");

interface FeedScreenProps {
  onBack?: () => void;
}

export const FeedScreen = ({ onBack }: FeedScreenProps) => {
  const { user } = React.useContext(AuthContext);
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadFeed();
  }, [user?.id]);

  const loadFeed = async () => {
    if (!user?.id) return;
    setLoading(true);
    const feedVideos = await feedService.getPersonalizedFeed(user.id, 20, 0);
    setVideos(feedVideos);
    setLoading(false);
  };

  const handleLike = async (videoId: string) => {
    if (!user?.id) return;

    if (likedVideos.has(videoId)) {
      setLikedVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } else {
      setLikedVideos((prev) => new Set(prev).add(videoId));
      await feedService.recordInteraction({
        userId: user.id,
        videoId,
        interactionType: "like",
      });
    }
  };

  const handleSkip = async (videoId: string) => {
    if (!user?.id) return;
    await feedService.recordInteraction({
      userId: user.id,
      videoId,
      interactionType: "skip",
    });
  };

  const handleViewVideo = async (videoId: string) => {
    if (!user?.id) return;
    await feedService.recordInteraction({
      userId: user.id,
      videoId,
      interactionType: "view",
      watchDurationSeconds: 5,
    });
  };

  const renderVideoCard = ({ item }: { item: FeedVideo }) => (
    <View style={styles.videoContainer}>
      {/* Thumbnail avec overlay sombre */}
      <Image
        source={{ uri: item.thumbnail_url || item.video_url }}
        style={styles.thumbnail}
      />
      <View style={styles.overlay} />

      {/* Contenu inférieur */}
      <View style={styles.contentWrapper}>
        {/* Infos vidéo */}
        <View style={styles.videoInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Auteur */}
          <View style={styles.authorRow}>
            {item.user_avatar && (
              <Image source={{ uri: item.user_avatar }} style={styles.avatar} />
            )}
            <View>
              <Text style={styles.authorName}>{item.username}</Text>
              {item.restaurant_name && (
                <Text style={styles.restaurantName}>
                  {item.restaurant_name}
                </Text>
              )}
            </View>
          </View>

          {/* Tags */}
          {item.tags && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
            >
              {item.tags.split(", ").map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>
                    #{tag.split("(")[0].trim()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Boutons d'action (droite) */}
        <View style={styles.actionButtons}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.video_id)}
          >
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionCount}>
              {item.like_count + (likedVideos.has(item.video_id) ? 1 : 0)}
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* More options */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              handleSkip(item.video_id);
              setCurrentIndex((prev) => prev + 1);
              flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
              });
            }}
          >
            <Text style={styles.actionIcon}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Play button overlay (si pas en web) */}
      {Platform.OS !== "web" && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handleViewVideo(item.video_id)}
        >
          <Text style={styles.playButtonText}>▶️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement du feed...</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune vidéo à afficher</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadFeed}>
          <Text style={styles.refreshButtonText}>Rafraîchir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feed Vidéos</Text>
          <TouchableOpacity onPress={loadFeed}>
            <Text style={styles.headerRefresh}>🔄</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {videos.map((video) => (
            <View key={video.video_id} style={styles.webVideoCard}>
              {renderVideoCard({ item: video })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.video_id}
        pagingEnabled
        scrollEventThrottle={16}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FIGTREE_FONT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    fontFamily: FIGTREE_FONT,
  },
  refreshButton: {
    backgroundColor: "#E4000F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: FIGTREE_FONT,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#E4000F",
    borderRadius: 6,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: FIGTREE_FONT,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: FIGTREE_FONT,
  },
  headerRefresh: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  webVideoCard: {
    height: height * 0.7,
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  contentWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  videoInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: FIGTREE_FONT,
  },
  description: {
    color: "#e0e0e0",
    fontSize: 14,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: FIGTREE_FONT,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  authorName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: FIGTREE_FONT,
  },
  restaurantName: {
    color: "#ffd700",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: FIGTREE_FONT,
  },
  tagsContainer: {
    marginTop: 10,
    marginBottom: 0,
  },
  tagBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FIGTREE_FONT,
  },
  actionButtons: {
    position: "absolute",
    right: 12,
    bottom: 80,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginVertical: 16,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  actionCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: FIGTREE_FONT,
  },
  playButton: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(228, 0, 15, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    top: "50%",
    marginTop: -30,
  },
  playButtonText: {
    fontSize: 22,
    color: "#fff",
  },
});

export default FeedScreen;
