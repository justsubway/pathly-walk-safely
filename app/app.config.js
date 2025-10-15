import 'dotenv/config';

export default {
  expo: {
    name: "Pathly",
    slug: "pathly",
    version: "0.1.0",
    sdkVersion: "54.0.0",
    platforms: ["ios", "android", "web"],
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses your location to show your position on the map and calculate safer walking routes in Athens.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses your location to show your position on the map and calculate safer walking routes in Athens.",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here"
        }
      }
    },
    web: {
      bundler: "metro"
    },
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here",
    }
  }
};


