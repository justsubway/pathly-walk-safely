import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import { LatLng } from '../lib/types';
import { ATHENS_PRESETS, LocationPreset } from '../data/athensPresets';
import { getPlaceAutocomplete, PlaceSuggestion } from '../services/googlePlacesService';
import { greekTranslations } from '../translations/greek';

interface LocationInputProps {
  label: string;
  placeholder: string;
  selectedLocation: LatLng | null;
  onLocationSelect: (location: LatLng, name: string) => void;
  emoji: string;
}

export default function LocationInput({ 
  label, 
  placeholder, 
  selectedLocation, 
  onLocationSelect, 
  emoji 
}: LocationInputProps): React.JSX.Element {
  const [showOptions, setShowOptions] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<LocationPreset | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(true); // Always in search mode

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchInput.length >= 2 && searchMode && !selectedPlace && !selectedPreset) {
        setLoading(true);
        try {
          const results = await getPlaceAutocomplete(searchInput);
          setGoogleSuggestions(results);
        } catch (error) {
          console.error('Error fetching place suggestions:', error);
          setGoogleSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setGoogleSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, searchMode, selectedPlace, selectedPreset]);

  const handlePresetSelect = (preset: LocationPreset) => {
    setSelectedPreset(preset);
    setSelectedPlace(null);
    setSearchInput(preset.name);
    onLocationSelect(preset.coordinates, preset.name);
    setShowOptions(false);
  };

  const handlePlaceSelect = (place: PlaceSuggestion) => {
    setSelectedPlace(place);
    setSelectedPreset(null);
    setSearchInput(place.name);
    onLocationSelect(place.coordinates, place.name);
    setShowOptions(false);
  };

  const clearSelection = () => {
    setSelectedPreset(null);
    setSelectedPlace(null);
    setSearchInput('');
    setShowOptions(false);
  };

  const handleInputFocus = () => {
    setShowOptions(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Image source={require('../../assets/icons/pin.png')} style={styles.labelIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.searchIconContainer}>
          <Image source={require('../../assets/icons/search.png')} style={styles.searchIcon} />
        </View>
        <TextInput
          style={[styles.textInput, (selectedPreset || selectedPlace) && styles.textInputSelected]}
          placeholder={placeholder}
          placeholderTextColor="#a1a1aa"
          value={searchInput}
          onChangeText={setSearchInput}
          onFocus={handleInputFocus}
          editable={true}
        />
        {(selectedPreset || selectedPlace) && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearSelection}
          >
            <Image source={require('../../assets/icons/close.png')} style={styles.clearButtonIcon} />
          </TouchableOpacity>
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#22c55e" />
          </View>
        )}
      </View>
      
      {(selectedPreset || selectedPlace) && (
        <View style={styles.selectedInfo}>
          <Image source={require('../../assets/icons/check.png')} style={styles.selectedIcon} />
          <Text style={styles.selectedName}>
            {selectedPreset?.name || selectedPlace?.name}
          </Text>
          <Text style={styles.selectedCoords}>
            {(selectedPreset?.coordinates || selectedPlace?.coordinates).latitude.toFixed(4)}, {(selectedPreset?.coordinates || selectedPlace?.coordinates).longitude.toFixed(4)}
          </Text>
        </View>
      )}
      
      {showOptions && (
        <View style={styles.optionsContainer}>
          {searchMode ? (
            <>
              <View style={styles.sectionTitleContainer}>
                <Image source={require('../../assets/icons/search.png')} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Search Results</Text>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#22c55e" />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : googleSuggestions.length > 0 ? (
                <ScrollView style={styles.suggestionsList}>
                  {googleSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.place_id}
                      style={styles.suggestionItem}
                      onPress={() => handlePlaceSelect(suggestion)}
                    >
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionAddress}>{suggestion.address}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : searchInput.length >= 2 ? (
                <Text style={styles.noResultsText}>No results found</Text>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.sectionTitleContainer}>
                <Image source={require('../../assets/icons/map.png')} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Popular Places in Athens</Text>
              </View>
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
            </>
          )}
          
          <View style={styles.modeToggle}>
            <TouchableOpacity 
              style={[styles.modeButton, !searchMode && styles.modeButtonActive]}
              onPress={() => setSearchMode(false)}
            >
              <Image source={require('../../assets/icons/map.png')} style={styles.modeButtonIcon} />
              <Text style={[styles.modeButtonText, !searchMode && styles.modeButtonTextActive]}>
                Presets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, searchMode && styles.modeButtonActive]}
              onPress={() => setSearchMode(true)}
            >
              <Image source={require('../../assets/icons/search.png')} style={styles.modeButtonIcon} />
              <Text style={[styles.modeButtonText, searchMode && styles.modeButtonTextActive]}>
                Search
              </Text>
            </TouchableOpacity>
          </View>
          
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
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
    width: 16,
    height: 16,
    opacity: 0.6,
    tintColor: '#a1a1aa',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    letterSpacing: -0.1,
    color: '#ffffff',
  },
  textInputSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    shadowColor: '#22c55e',
    shadowOpacity: 0.2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButtonIcon: {
    width: 16,
    height: 16,
    tintColor: '#ff3b30',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  selectedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: -0.1,
  },
  selectedCoords: {
    fontSize: 12,
    color: '#a1a1aa',
    letterSpacing: 0.2,
  },
  optionsContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  presetChipSelected: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.25,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  presetEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
  },
  hideOptionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
    letterSpacing: -0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#a1a1aa',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#a1a1aa',
    padding: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 4,
    marginVertical: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modeButtonIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#a1a1aa',
  },
  modeButtonActive: {
    backgroundColor: '#22c55e',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
});