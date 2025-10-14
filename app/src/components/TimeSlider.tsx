import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Slider from '@react-native-community/slider';
interface TimeSliderProps {
  selectedHour: number;
  onHourChange: (hour: number) => void;
}
export default function TimeSlider({ selectedHour, onHourChange }: TimeSliderProps): React.JSX.Element {
  const formatHour = (hour: number): string => {
    const wholeHour = Math.floor(hour);
    const minutes = Math.round((hour - wholeHour) * 60);
    let displayHour = wholeHour;
    let ampm: string;
    if (wholeHour === 0 || wholeHour === 24) {
      displayHour = 12;
      ampm = 'AM';
    } else if (wholeHour === 12) {
      displayHour = 12;
      ampm = 'PM';
    } else if (wholeHour > 12) {
      displayHour = wholeHour - 12;
      ampm = 'PM';
    } else {
      ampm = 'AM';
    }
    const minuteStr = minutes === 0 ? '00' : minutes.toString().padStart(2, '0');
    return `${displayHour}:${minuteStr} ${ampm}`;
  };
  const getTimeContext = (hour: number): { icon: any; label: string; color: string } => {
    const wholeHour = Math.floor(hour);
    if (wholeHour >= 6 && wholeHour < 12) {
      return { icon: require('../../assets/icons/target.png'), label: 'Morning', color: '#f59e0b' };
    } else if (wholeHour >= 12 && wholeHour < 17) {
      return { icon: require('../../assets/icons/target.png'), label: 'Afternoon', color: '#eab308' };
    } else if (wholeHour >= 17 && wholeHour < 21) {
      return { icon: require('../../assets/icons/target.png'), label: 'Evening', color: '#f97316' };
    } else {
      return { icon: require('../../assets/icons/target.png'), label: 'Night', color: '#6366f1' };
    }
  };
  const timeContext = getTimeContext(selectedHour);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Leave at</Text>
        <View style={styles.timeDisplay}>
          <Image source={timeContext.icon} style={[styles.timeIcon, { tintColor: timeContext.color }]} />
          <Text style={[styles.timeText, { color: timeContext.color }]}>
            {formatHour(selectedHour)}
          </Text>
          <Text style={styles.contextLabel}>{timeContext.label}</Text>
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={24}
          step={0.5}
          value={selectedHour}
          onValueChange={onHourChange}
          minimumTrackTintColor={timeContext.color}
          maximumTrackTintColor="#404040"
          thumbTintColor={timeContext.color}
        />
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>12 AM</Text>
          <Text style={styles.timeLabel}>6 AM</Text>
          <Text style={styles.timeLabel}>12 PM</Text>
          <Text style={styles.timeLabel}>6 PM</Text>
          <Text style={styles.timeLabel}>12 AM</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.1,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 17,
    fontFamily: 'SF Pro Display',
    fontWeight: '800',
    marginRight: 10,
    letterSpacing: -0.2,
  },
  contextLabel: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});