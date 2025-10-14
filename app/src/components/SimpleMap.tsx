import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Temporary placeholder until we fix native modules
export default function SimpleMap(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️ Map View</Text>
        <Text style={styles.subText}>Athens, Greece</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 8
  },
  placeholderText: {
    fontSize: 24,
    color: '#007aff',
    marginBottom: 8
  },
  subText: {
    fontSize: 16,
    color: '#666'
  }
});


