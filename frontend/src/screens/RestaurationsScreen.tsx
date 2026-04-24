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
  Linking,
  FlatList,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";
import { AppIcon } from "../components/AppIcon";

const CERTIFIED_BADGE = require("../../assets/icons/certified-badge.png");

const FIGTREE_FONT = "Figtree-Medium";

interface RestaurationsScreenProps {
  onOpenFeed?: () => void;
}

type RestaurantSection = {
  id: string;
  title: string;
  avatarUrl: string;
  isCertified: boolean;
  items: Restaurant[];
};

const RESTAURANTS_PER_CAROUSEL = 15;
const INFLUENCER_CAROUSELS_COUNT = 4;

const openTheFork = async () => {
  const url = "https://www.thefork.fr/";

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    console.error("Impossible d'ouvrir l'URL");
  }
};

const CURATOR_PROFILES = [
  {
    title: "La sélection de Léna Situations",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/ea/L%C3%A9na_Situations_during_the_MiuMiu_Fashion_Show.png",
    isCertified: true,
  },
  {
    title: "La sélection de Pape San",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/34/Pape_San_en_2025.png",
    isCertified: true,
  },
  {
    title: "La sélection de Cédric Grolet",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c9/C%C3%A9dric_Grolet_-_cropped_from_%22Meir_danon_cedric_grolet%22.jpg",
    isCertified: true,
  },
  {
    title: "La sélection de Salt Bae (Nusret Gökçe)",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/97/Salt_Bae.png",
    isCertified: true,
  },
];

const GUIDE_MICHELIN_PROFILE = {
  title: "Les formules à moins de 30€",
  avatarUrl:
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Michelin_guide_logo.png",
  isCertified: false,
};

const USER_PROFILE = {
  title: "Sélection par vous",
  avatarUrl:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
  isCertified: false,
};

const normalizeText = (value?: string) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const hasOnlyLettersAndSpaces = (value?: string) => {
  const name = (value || "").trim();
  if (!name) return false;
  return /^[\p{L}\s]+$/u.test(name);
};

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

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
          <View style={styles.cardBrandIcon}>
            <AppIcon name="bibGourmand" width={18} height={16} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {restaurant.name}
          </Text>
        </View>

        <View style={styles.cardPriceFavoriteRow}>
          <Text style={styles.cardPrice}>
            {getPriceSymbol(restaurant.price_range)}
          </Text>
          <View style={styles.cardFavorite}>
            <AppIcon name="favoris" width={18} height={16} />
          </View>
        </View>

        <Text style={styles.cardLocation} numberOfLines={1}>
          {getLocationLabel(restaurant)}
        </Text>

        <TouchableOpacity
          style={styles.reserveButton}
          activeOpacity={0.85}
          onPress={openTheFork}
        >
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
        {section.isCertified && (
          <Image
            source={CERTIFIED_BADGE}
            style={styles.certifiedBadge}
            resizeMode="contain"
          />
        )}
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
    if (!query) {
      return restaurants.filter((restaurant) =>
        hasOnlyLettersAndSpaces(restaurant.name),
      );
    }

    return restaurants.filter((restaurant) => {
      if (!hasOnlyLettersAndSpaces(restaurant.name)) return false;

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

  const randomizedRestaurants = useMemo(
    () => shuffleArray(filteredRestaurants),
    [filteredRestaurants],
  );

  const sections = useMemo<RestaurantSection[]>(() => {
    return SECTION_PROFILES.map((profile, index) => {
      const start = index * RESTAURANTS_PER_CAROUSEL;
      const end = start + RESTAURANTS_PER_CAROUSEL;

      return {
        id: `section-${index}`,
        title: profile.title,
        avatarUrl: profile.avatarUrl,
        isCertified: profile.isCertified,
        items: randomizedRestaurants.slice(start, end),
      };
    }).filter((section) => section.items.length > 0);
  }, [randomizedRestaurants]);

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
      <Text style={styles.screenTitle}>Restauration</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <View style={styles.searchIcon}>
            <AppIcon name="loupe" width={17} height={17} />
          </View>
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
        ) : null}  laisser en commentaire pas inclure pour l'instant*/}
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
    backgroundColor: "#F5F1EE",
    paddingTop: Platform.OS === "ios" ? 60 : 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F1EE",
  },
  loadingText: {
    marginTop: 12,
    color: "#716963",
    fontSize: 12,
    fontFamily: FIGTREE_FONT,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 33,
    color: "#101010",
    paddingHorizontal: 24,
    marginBottom: 18,
    fontFamily: FIGTREE_FONT,
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
    width: 17,
    height: 17,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    color: "#2D2621",
    fontSize: 14,
    fontFamily: FIGTREE_FONT,
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
    fontSize: 12,
    color: "#3E3732",
    fontFamily: FIGTREE_FONT,
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
    flexShrink: 1,
    color: "#3E3732",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FIGTREE_FONT,
  },
  certifiedBadge: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  sectionCardsRow: {
    paddingHorizontal: 24,
    gap: 14,
  },
  restaurantCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 130,
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
    width: 18,
    height: 16,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: "#101010",
    fontFamily: FIGTREE_FONT,
  },
  cardPriceFavoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  cardPrice: {
    color: "#27211D",
    fontSize: 15,
    fontFamily: FIGTREE_FONT,
  },
  cardFavorite: {
    width: 18,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLocation: {
    marginTop: 8,
    color: "#534A43",
    fontSize: 12,
    fontFamily: FIGTREE_FONT,
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
    fontSize: 16,
    fontFamily: FIGTREE_FONT,
  },
  emptyState: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#2D2621",
    fontFamily: FIGTREE_FONT,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    color: "#716963",
    fontFamily: FIGTREE_FONT,
  },
});
