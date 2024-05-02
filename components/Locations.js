import React, { useState, useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';


export default function Locations() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  const locations = [
    { name: "Espoo", address: "Iso Omena, Piispansilta 11, 3. krs", latitude: 60.1616, longitude: 24.7382 },
    { name: "Helsinki", address: "Bulevardi 10, 2. krs", latitude: 60.1655, longitude: 24.9409 },
    { name: "Vantaa", address: "Kauppakeskus Dixi, Ratatie 11, 1. krs", latitude: 60.2924, longitude: 25.0411 }
  ];

  // Kysytään käyttäjältä lupa sijainnista
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      let locationResult = await Location.getCurrentPositionAsync({});
      setLocation(locationResult.coords);
    })();
  }, []);

  // Zoomaa kohteeseen, kun kohteen tekstiä painetaan
  const zoomToLocation = (latitude, longitude) => {
    mapRef.current.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // Ohjaus Booking.js sivulle lokaatio-tiedon kanssa
  const handleLocationSelect = (locationName) => {
    navigation.navigate('Booking', { selectedLocation: locationName });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider="google"
        style={styles.map}
        initialRegion={{
          latitude: 60.200692,
          longitude: 24.934302,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {locations.map((loc, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
          />
        ))}
      </MapView>
      <ScrollView style={styles.locationList}>
        {locations.map((loc, index) => (
          <View key={index} style={styles.locationItem}>
            <TouchableOpacity style={styles.locationInfo} onPress={() => zoomToLocation(loc.latitude, loc.longitude)}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <Text>{loc.address}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => handleLocationSelect(loc.name)}>
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  map: {
    height: '50%',
    width: '100%',
  },
  locationList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  bookButtonText: {
    color: 'white',
    textAlign: 'center',
  }
});
