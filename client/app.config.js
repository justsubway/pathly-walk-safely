import 'dotenv/config';
export default {
  expo: {
    platforms: ["ios", "android"],
    name: "Safe2Walk",
    slug: "safe2walk",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#f8fafc"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses your location to show your position on the map and calculate safer walking routes.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses your location to show your position on the map and calculate safer walking routes.",
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
        googleMaps:
          {
            apiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here"
          }
      }
    },
    web: {
      bundler: "metro"
    },
    scheme: "safe2walk",
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here",
    }
  }
};