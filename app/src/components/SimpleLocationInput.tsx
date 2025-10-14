import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LatLng } from '../lib/types';
import { ATHENS_PRESETS, LocationPreset } from '../data/athensPresets';

interface SimpleLocationInputProps {
  label: string;
  placeholder: string;
  selectedLocation: LatLng | null;
  onLocationSelect: (location: LatLng, name: string) => void;
  emoji: string;
}

export default function SimpleLocationInput({ 
  label, 
  placeholder, 
  selectedLocation, 
  onLocationSelect, 
  emoji 
}: SimpleLocationInputProps): React.JSX.Element {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<LocationPreset | null>(null);

  const handlePresetSelect = (preset: LocationPreset) => {
    setSelectedPreset(preset);
    onLocationSelect(preset.coordinates, preset.name);
    setShowOptions(false);
  };

  const clearSelection = () => {
    setSelectedPreset(null);
    setShowOptions(false);
  };

  const handleInputFocus = () => {
    setShowOptions(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{emoji} {label}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>📍</Text>
        </View>
        <TextInput
          style={[styles.textInput, selectedPreset && styles.textInputSelected]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={selectedPreset?.name || ''}
          onFocus={handleInputFocus}
          editable={false}
        />
        {selectedPreset && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearSelection}
          >
            <Text style={styles.clearButtonText}>✖️</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {selectedPreset && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedEmoji}>
            {selectedPreset.emoji}
          </Text>
          <Text style={styles.selectedName}>
            {selectedPreset.name}
          </Text>
          <Text style={styles.selectedCoords}>
            {selectedPreset.coordinates.latitude.toFixed(4)}, {selectedPreset.coordinates.longitude.toFixed(4)}
          </Text>
        </View>
      )}
      
      {showOptions && (
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>📍 Popular Places in Athens</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.presetScroll}
          >
            {ATHENS_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  selectedPreset?.id === preset.id && styles.presetChipSelected
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text style={[
                  styles.presetText,
                  selectedPreset?.id === preset.id && styles.presetTextSelected
                ]}>
                  {preset.shortName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.hideOptionsButton}
            onPress={() => setShowOptions(false)}
          >
            <Text style={styles.hideOptionsText}>Hide</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    pointerEvents: 'none',
  },
  searchIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    letterSpacing: -0.1,
  },
  textInputSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '700',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -0.1,
  },
  selectedCoords: {
    fontSize: 12,
    color: '#8e8e93',
    letterSpacing: 0.2,
  },
  optionsContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  presetScroll: {
    maxHeight: 70,
  },
  presetChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 0,
    minWidth: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  presetChipSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.25,
  },
  presetEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1c1e',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  presetTextSelected: {
    color: '#fff',
  },
  hideOptionsButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
  },
  hideOptionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    letterSpacing: -0.1,
  },
});





