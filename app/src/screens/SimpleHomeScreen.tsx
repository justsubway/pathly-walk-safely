import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TimeSlider from '../components/TimeSlider';
import SimpleLocationInput from '../components/SimpleLocationInput';
import { LatLng } from '../lib/types';

export default function SimpleHomeScreen(): React.JSX.Element {
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [origin, setOrigin] = useState<{ location: LatLng; name: string } | null>(null);
  const [destination, setDestination] = useState<{ location: LatLng; name: string } | null>(null);

  const handleOriginSelect = (location: LatLng, name: string) => {
    setOrigin({ location, name });
  };

  const handleDestinationSelect = (location: LatLng, name: string) => {
    setDestination({ location, name });
  };

  const handleTimeChange = (newHour: number) => {
    setSelectedHour(newHour);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.title}>Pathly</Text>
            <Text style={styles.subtitle}>Smart Navigation for Athens</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Route Planning</Text>
          <SimpleLocationInput
            label="From"
            placeholder="Choose start"
            selectedLocation={origin?.location || null}
            onLocationSelect={handleOriginSelect}
            emoji="🚀"
          />
          <SimpleLocationInput
            label="To"
            placeholder="Choose destination"
            selectedLocation={destination?.location || null}
            onLocationSelect={handleDestinationSelect}
            emoji="🎯"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Time</Text>
          <TimeSlider 
            selectedHour={selectedHour}
            onHourChange={handleTimeChange}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Map</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Map View</Text>
            <Text style={styles.mapSubtext}>Athens, Greece</Text>
            {origin && (
              <Text style={styles.locationText}>From: {origin.name}</Text>
            )}
            {destination && (
              <Text style={styles.locationText}>To: {destination.name}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>🔍 Find Safe Routes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e5f3ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  mapText: {
    fontSize: 24,
    color: '#007aff',
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
});
