import { Linking, Platform, Alert, Share } from 'react-native';
import { LatLng, RouteResult } from '../lib/types';
export class RouteExportService {
  static async exportToGoogleMaps(route: RouteResult, origin: LatLng, destination: LatLng): Promise<void> {
    try {
      const routeCoords = route.coords || [];
      if (routeCoords.length < 2) {
        Alert.alert('Export Error', 'Route must have at least 2 points');
        return;
      }
      const routeOrigin = routeCoords[0];
      const routeDestination = routeCoords[routeCoords.length - 1];
      const waypoints = routeCoords.slice(1, -1);
      const maxWaypoints = 23;
      let sampledWaypoints = waypoints;
      if (waypoints.length > maxWaypoints) {
        const step = Math.ceil(waypoints.length / maxWaypoints);
        sampledWaypoints = waypoints.filter((_, index) => index % step === 0);
        sampledWaypoints = sampledWaypoints.slice(0, maxWaypoints);
      }
      const waypointStr = sampledWaypoints
        .map(coord => `${coord.latitude},${coord.longitude}`)
        .join('|');
      let url = `https://www.google.com/maps/dir/?api=1`;
      url += `&origin=${routeOrigin.latitude},${routeOrigin.longitude}`;
      url += `&destination=${routeDestination.latitude},${routeDestination.longitude}`;
      url += `&travelmode=walking`;
      if (waypointStr) {
        url += `&waypoints=${waypointStr}`;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert(
          'Success! 🗺️', 
          `Route "${route.name}" exported to Google Maps with ${sampledWaypoints.length} waypoints!\n\nThis will show the exact Pathly route.`
        );
      } else {
        Alert.alert('Export Error', 'Could not open Google Maps. Please ensure Google Maps is installed.');
      }
    } catch (error) {
      console.error('❌ Error exporting to Google Maps:', error);
      Alert.alert('Export Error', 'Could not open Google Maps. Please try again.');
    }
  }
  static async exportToAppleMaps(route: RouteResult, origin: LatLng, destination: LatLng): Promise<void> {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Available', 'Apple Maps is only available on iOS devices');
        return;
      }
      const routeCoords = route.coords || [];
      if (routeCoords.length < 2) {
        Alert.alert('Export Error', 'Route must have at least 2 points');
        return;
      }
      const routeOrigin = routeCoords[0];
      const routeDestination = routeCoords[routeCoords.length - 1];
      const url = `http://maps.apple.com/?saddr=${routeOrigin.latitude},${routeOrigin.longitude}&daddr=${routeDestination.latitude},${routeDestination.longitude}&dirflg=w`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert(
          'Success! 🍎', 
          `Route "${route.name}" exported to Apple Maps!\n\nNote: Apple Maps may not follow the exact Pathly route due to platform limitations.`
        );
      } else {
        Alert.alert('Error', 'Could not open Apple Maps');
      }
    } catch (error) {
      console.error('❌ Error exporting to Apple Maps:', error);
      Alert.alert('Export Error', 'Could not open Apple Maps. Please try again.');
    }
  }
  static async exportToWaze(route: RouteResult, origin: LatLng, destination: LatLng): Promise<void> {
    try {
      const routeCoords = route.coords || [];
      if (routeCoords.length < 2) {
        Alert.alert('Export Error', 'Route must have at least 2 points');
        return;
      }
      const routeDestination = routeCoords[routeCoords.length - 1];
      const url = `https://waze.com/ul?ll=${routeDestination.latitude},${routeDestination.longitude}&navigate=yes&zoom=17`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Alert.alert(
          'Success! 🚗', 
          `Route destination exported to Waze!\n\nNote: Waze will calculate its own route to the destination.`
        );
      } else {
        Alert.alert('Error', 'Waze app not installed or not available');
      }
    } catch (error) {
      console.error('❌ Error exporting to Waze:', error);
      Alert.alert('Export Error', 'Could not open Waze. Please try again.');
    }
  }
  static async shareRoute(route: RouteResult, origin: LatLng, destination: LatLng): Promise<void> {
    try {
      const routeCoords = route.coords || [];
      if (routeCoords.length < 2) {
        Alert.alert('Share Error', 'Route must have at least 2 points');
        return;
      }
      const routeOrigin = routeCoords[0];
      const routeDestination = routeCoords[routeCoords.length - 1];
      const waypoints = routeCoords.slice(1, -1);
      const maxWaypoints = 23;
      let sampledWaypoints = waypoints;
      if (waypoints.length > maxWaypoints) {
        const step = Math.ceil(waypoints.length / maxWaypoints);
        sampledWaypoints = waypoints.filter((_, index) => index % step === 0);
        sampledWaypoints = sampledWaypoints.slice(0, maxWaypoints);
      }
      let googleMapsUrl = `https://www.google.com/maps/dir/?api=1`;
      googleMapsUrl += `&origin=${routeOrigin.latitude},${routeOrigin.longitude}`;
      googleMapsUrl += `&destination=${routeDestination.latitude},${routeDestination.longitude}`;
      googleMapsUrl += `&travelmode=walking`;
      if (sampledWaypoints.length > 0) {
        const waypointStr = sampledWaypoints
          .map(coord => `${coord.latitude},${coord.longitude}`)
          .join('|');
        googleMapsUrl += `&waypoints=${waypointStr}`;
      }
      const shareMessage = `🚶‍♂️ Pathly Route - ${route.name}\n\n` +
        `🛡️ Safety Score: ${route.safetyScore}/100\n` +
        `📏 Distance: ${route.distanceKm?.toFixed(1) || 'N/A'} km\n` +
        `⏱️ Duration: ${route.etaMin ? Math.round(route.etaMin) : 'N/A'} minutes\n` +
        `📍 Waypoints: ${routeCoords.length} points\n\n` +
        `View exact route in Google Maps:\n${googleMapsUrl}`;
      await Share.share({
        message: shareMessage,
        title: `Pathly Route: ${route.name}`,
        url: googleMapsUrl, // iOS only
      });
    } catch (error) {
      console.error('❌ Error sharing route:', error);
      Alert.alert('Share Error', 'Could not share route. Please try again.');
    }
  }
  static generateGPX(route: RouteResult, origin: LatLng, destination: LatLng): string {
    const routeCoords = route.coords || [];
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pathly" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${route.name}</name>
    <desc>Pathly route with safety score: ${route.safetyScore}/100 | ${routeCoords.length} waypoints</desc>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <desc>Safety Score: ${route.safetyScore}/100 | Distance: ${route.distanceKm?.toFixed(1)}km | Duration: ${route.etaMin ? Math.round(route.etaMin) : 'N/A'} min | Waypoints: ${routeCoords.length}</desc>
    <trkseg>`;
    const trackPoints = routeCoords.map((coord, index) => 
      `      <trkpt lat="${coord.latitude}" lon="${coord.longitude}">
        <name>Point ${index + 1}</name>
        <desc>${index === 0 ? 'Start' : index === routeCoords.length - 1 ? 'Finish' : `Waypoint ${index}`}</desc>
      </trkpt>`
    ).join('\n');
    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;
    return gpxHeader + '\n' + trackPoints + gpxFooter;
  }
  static showExportOptions(route: RouteResult, origin: LatLng, destination: LatLng): void {
    const options = [
      'Export to Google Maps',
      'Share Route Link',
      'Cancel'
    ];
    if (Platform.OS === 'ios') {
      options.splice(1, 0, 'Export to Apple Maps');
    }
    options.splice(-1, 0, 'Export to Waze');
    Alert.alert(
      'Export Route 🗺️',
      `Export "${route.name}" to navigation app?`,
      [
        {
          text: 'Google Maps 🗺️',
          onPress: () => this.exportToGoogleMaps(route, origin, destination)
        },
        ...(Platform.OS === 'ios' ? [{
          text: 'Apple Maps 🍎',
          onPress: () => this.exportToAppleMaps(route, origin, destination)
        }] : []),
        {
          text: 'Waze 🚗',
          onPress: () => this.exportToWaze(route, origin, destination)
        },
        {
          text: 'Share Link 📤',
          onPress: () => this.shareRoute(route, origin, destination)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }
}
export default RouteExportService;