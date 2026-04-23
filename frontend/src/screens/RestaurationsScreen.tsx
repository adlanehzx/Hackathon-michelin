import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  FlatList,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";

interface RestaurationsScreenProps {
  onOpenFeed?: () => void;
}

type RestaurantSection = {
  id: string;
  title: string;
  avatarUrl: string;
  items: Restaurant[];
};

const RESTAURANTS_PER_CAROUSEL = 15;
const INFLUENCER_CAROUSELS_COUNT = 6;

const CURATOR_PROFILES = [
  {
    title: "La sélection de @LenaLifestyle",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
  },
  {
    title: "Les spots de @FoodieNomade",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    title: "Coups de coeur de @ChefExplorer",
    avatarUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=160&q=80",
  },
  {
    title: "Table trends par @GastroVibes",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
  },
  {
    title: "Adresses lifestyle de @UrbanBites",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
  },
  {
    title: "Les tables de @LuxeFoodDiary",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=160&q=80",
  },
];

const GUIDE_MICHELIN_PROFILE = {
  title: "Sélection Guide Michelin",
  avatarUrl:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=160&q=80",
};

const USER_PROFILE = {
  title: "Sélection par vous",
  avatarUrl:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
};

const normalizeText = (value?: string) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getPriceSymbol = (priceRange?: string) => {
  const value = normalizeText(priceRange);

  if (value === "luxury") return "€€€";
  if (value === "premium" || value === "expensive") return "€€";
  if (value === "moderate" || value === "affordable") return "€";

  return "€";
};

const getLocationLabel = (restaurant: Restaurant) => {
  const city = restaurant.city || "Ville inconnue";
  const country = restaurant.country || "Pays inconnu";
  return `${city}, ${country}`;
};

const SECTION_PROFILES = [
  ...CURATOR_PROFILES.slice(0, INFLUENCER_CAROUSELS_COUNT),
  GUIDE_MICHELIN_PROFILE,
  USER_PROFILE,
];

const RestaurantCarouselCard = ({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.restaurantCard}
      activeOpacity={0.9}
      onPress={() => onPress(restaurant)}
    >
      {restaurant.image_url ? (
        <Image
          source={{ uri: restaurant.image_url }}
          style={styles.cardImage}
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderIcon}>🍽️</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardBrandIcon}>◎</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {restaurant.name}
          </Text>
        </View>

        <View style={styles.cardPriceFavoriteRow}>
          <Text style={styles.cardPrice}>
            {getPriceSymbol(restaurant.price_range)}
          </Text>
          <Text style={styles.cardFavorite}>♡</Text>
        </View>

        <Text style={styles.cardLocation} numberOfLines={1}>
          {getLocationLabel(restaurant)}
        </Text>

        <TouchableOpacity style={styles.reserveButton} activeOpacity={0.85}>
          <Text style={styles.reserveButtonText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const RestaurantSectionBlock = ({
  section,
  onPressRestaurant,
}: {
  section: RestaurantSection;
  onPressRestaurant: (restaurant: Restaurant) => void;
}) => {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Image
          source={{ uri: section.avatarUrl }}
          style={styles.curatorAvatar}
        />
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {section.title}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionCardsRow}
      >
        {section.items.map((restaurant) => (
          <RestaurantCarouselCard
            key={restaurant.id}
            restaurant={restaurant}
            onPress={onPressRestaurant}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const RestaurationsScreen = ({
  onOpenFeed,
}: RestaurationsScreenProps) => {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getAllRestaurants();
        setRestaurants(
          data.filter((restaurant) => restaurant.lat && restaurant.lng),
        );
      } catch (error) {
        console.error("Erreur:", error);
        Alert.alert("Erreur", "Impossible de charger les restaurants");
      } finally {
        setLoading(false);
      }
    };

    void loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = normalizeText(searchQuery);
    if (!query) return restaurants;

    return restaurants.filter((restaurant) => {
      const haystack = normalizeText(
        [
          restaurant.name,
          restaurant.city,
          restaurant.country,
          restaurant.area,
          restaurant.cuisine_type,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(query);
    });
  }, [restaurants, searchQuery]);

  const sections = useMemo<RestaurantSection[]>(() => {
    return SECTION_PROFILES.map((profile, index) => {
      const start = index * RESTAURANTS_PER_CAROUSEL;
      const end = start + RESTAURANTS_PER_CAROUSEL;

      return {
        id: `section-${index}`,
        title: profile.title,
        avatarUrl: profile.avatarUrl,
        items: filteredRestaurants.slice(start, end),
      };
    }).filter((section) => section.items.length > 0);
  }, [filteredRestaurants]);

  const handlePressRestaurant = (restaurant: Restaurant) => {
    const location = getLocationLabel(restaurant);
    const cuisine = restaurant.cuisine_type || "Cuisine non renseignée";
    const stars = restaurant.michelin_stars
      ? `${restaurant.michelin_stars} étoile(s)`
      : "Sans étoile";

    Alert.alert(restaurant.name, `${location}\n${cuisine}\n${stars}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C0012C" />
        <Text style={styles.loadingText}>Chargement des restaurants…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Restaurants</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de restaurant, parcours..."
            placeholderTextColor="#716963"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* {onOpenFeed ? (
          <TouchableOpacity style={styles.feedShortcut} onPress={onOpenFeed}>
            <Text style={styles.feedShortcutText}>feed</Text>
          </TouchableOpacity>
        ) : null} */}
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aucun restaurant trouvé</Text>
          <Text style={styles.emptyText}>Essayez un autre mot-clé.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantSectionBlock
              section={item}
              onPressRestaurant={handlePressRestaurant}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentScroll}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8E7E5",
    paddingTop: Platform.OS === "ios" ? 60 : 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8E7E5",
  },
  loadingText: {
    marginTop: 12,
    color: "#716963",
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 54,
    lineHeight: 58,
    color: "#101010",
    fontWeight: "700",
    paddingHorizontal: 24,
    marginBottom: 18,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-medium",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 24,
    color: "#534A43",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#2D2621",
    fontSize: 16,
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonIcon: {
    fontSize: 24,
    color: "#534A43",
  },
  feedShortcut: {
    alignSelf: "flex-end",
    marginRight: 24,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  feedShortcutText: {
    fontSize: 13,
    color: "#3E3732",
    fontWeight: "600",
  },
  contentScroll: {
    paddingBottom: 120,
    paddingTop: 2,
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  curatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sectionTitle: {
    flex: 1,
    color: "#3E3732",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "600",
  },
  sectionCardsRow: {
    paddingHorizontal: 24,
    gap: 14,
  },
  restaurantCard: {
    width: 238,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDD7D1",
  },
  cardImagePlaceholderIcon: {
    fontSize: 34,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardBrandIcon: {
    color: "#C0012C",
    fontSize: 18,
    marginTop: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    color: "#101010",
  },
  cardPriceFavoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  cardPrice: {
    color: "#27211D",
    fontSize: 17,
    fontWeight: "600",
  },
  cardFavorite: {
    color: "#101010",
    fontSize: 22,
    lineHeight: 24,
  },
  cardLocation: {
    marginTop: 8,
    color: "#534A43",
    fontSize: 14,
  },
  reserveButton: {
    height: 46,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#C0012C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  reserveButtonText: {
    color: "#C0012C",
    fontSize: 20,
    fontWeight: "500",
  },
  emptyState: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#2D2621",
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#716963",
  },
});
