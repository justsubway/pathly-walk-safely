import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
const { width, height } = Dimensions.get('window');
interface ModernSplashScreenProps {
  onAnimationFinish: () => void;
}
export default function ModernSplashScreen({ onAnimationFinish }: ModernSplashScreenProps): React.JSX.Element {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const backgroundGradient = useRef(new Animated.Value(0)).current;
  const dot1Opacity = useRef(new Animated.Value(1)).current;
  const dot2Opacity = useRef(new Animated.Value(0.6)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(backgroundGradient, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundGradient, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      onAnimationFinish();
    });
    const animateLoadingDots = () => {
      const createDotAnimation = (dotOpacity: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dotOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotOpacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };
      Animated.parallel([
        createDotAnimation(dot1Opacity, 0),
        createDotAnimation(dot2Opacity, 200),
        createDotAnimation(dot3Opacity, 400),
      ]).start();
    };
    setTimeout(animateLoadingDots, 2500);
  }, []);
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: backgroundGradient.interpolate({
            inputRange: [0, 1],
            outputRange: ['#000000', '#0a0a0a'],
          }),
        }
      ]}
    >
      {}
      <Animated.View 
        style={[
          styles.gradientCircle,
          {
            opacity: backgroundGradient.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.05],
            }),
          }
        ]} 
      />
      {}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <Image 
            source={require('../../assets/icons/Pathly_NoBG.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text 
          style={[
            styles.subtitle,
            { opacity: subtitleOpacity }
          ]}
        >
          Smart Navigation for Athens
        </Animated.Text>
      </Animated.View>
      {}
      <Animated.View 
        style={[
          styles.loadingContainer,
          { opacity: dotsOpacity }
        ]}
      >
        <View style={styles.dotContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
        <Text style={styles.loadingText}>Loading your safe routes...</Text>
      </Animated.View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  gradientCircle: {
    position: 'absolute',
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    backgroundColor: '#ffffff',
    top: -width,
    left: -width * 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#a1a1aa',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  dotContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#a1a1aa',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
});