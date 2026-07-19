import React from "react";
import {View, Text, StyleSheet, SafeAreaView, ScrollView, Image,} from "react-native";

const featured = [
  {
    id: 1,
    name: "Iced Spanish Latte",
    price: "₱150.00",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
  }
];

const menu = [
  {
    title: "Signature Brews",
    items: [
      {
        name: "Hiraya House Blend",
        desc: "Rich coffee with hints of chocolate and citrus.",
        price: "₱150.00",
      },
      {
        name: "Dirty Horchata",
        desc: "Sweet horchata with espresso.",
        price: "₱175.00",
      },
      {
        name: "Sea Salt Cream Latte",
        desc: "Smooth latte topped with sea salt cream.",
        price: "₱180.00",
      },
    ],
  },
  {
    title: "Signature Brews",
    items: [
      {
        name: "Hiraya House Blend",
        desc: "Rich coffee with hints of chocolate and citrus.",
        price: "₱150.00",
      },
      {
        name: "Dirty Horchata",
        desc: "Sweet horchata with espresso.",
        price: "₱175.00",
      },
      {
        name: "Sea Salt Cream Latte",
        desc: "Smooth latte topped with sea salt cream.",
        price: "₱180.00",
      },
    ],
  },
];

export default function MenuScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Menu</Text>

        {/* Featured Drinks */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
        >
          {featured.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image
                source={{ uri: item.image }}
                style={styles.cardImage}
              />

              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardPrice}>{item.price}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Menu Sections */}
        {menu.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item, idx) => (
              <View key={idx} style={styles.menuItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>

                <Text style={styles.price}>{item.price}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 18,
  },

  horizontal: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  card: {
    width: 150,
    marginRight: 14,
  },

  cardImage: {
    width: "100%",
    height: 90,
    borderRadius: 14,
  },

  cardTitle: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 13,
  },

  cardPrice: {
    marginTop: 3,
    color: "#777",
    fontSize: 12,
  },

  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },

  menuItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "flex-start",
  },

  itemTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },

  itemDesc: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    paddingRight: 20,
  },

  price: {
    fontWeight: "600",
    fontSize: 14,
    color: "#222",
    marginLeft: 15,
  },
});