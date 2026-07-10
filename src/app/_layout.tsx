import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MoodProvider } from '../context/MoodContext';
import { Colors } from '../constants/theme';
import { Lock, Delete } from 'lucide-react-native';

// Keep the splash screen visible while assets load
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { user, isLoading: authLoading, isLocked, verifyPin } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const [pinCode, setPinCode] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Protected route redirects based on authentication state
  useEffect(() => {
    if (authLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to main tabs if logged in
      router.replace('/(tabs)');
    }
  }, [user, authLoading, fontsLoaded, segments]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  // Handle PIN unlock inputs
  const handleKeyPress = async (num: string) => {
    if (pinCode.length >= 4) return;
    setPinError(false);
    const newPin = pinCode + num;
    setPinCode(newPin);

    if (newPin.length === 4) {
      const success = await verifyPin(newPin);
      if (success) {
        setPinCode('');
      } else {
        setPinCode('');
        setPinError(true);
        // Soft haptic/visual feedback
        setTimeout(() => setPinError(false), 800);
      }
    }
  };

  const handleDeletePress = () => {
    if (pinCode.length > 0) {
      setPinCode(pinCode.slice(0, -1));
    }
  };

  if (!fontsLoaded || authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Setting up your safe space...</Text>
      </View>
    );
  }

  // 1. PIN Lock Overlay Screen
  if (user && isLocked) {
    return (
      <View style={[styles.lockContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.lockHeader}>
          <View style={[styles.lockIconBg, { backgroundColor: colors.backgroundElement }]}>
            <Lock size={32} color={colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>Hitha Secure Lock</Text>
          <Text style={[styles.lockSubtitle, { color: colors.textSecondary }]}>
            Enter your 4-digit PIN to access your journal
          </Text>
        </View>

        {/* PIN Indicators */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((index) => {
            const isActive = pinCode.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    borderColor: pinError ? colors.accent : colors.primary,
                    backgroundColor: pinError 
                      ? colors.accent 
                      : isActive 
                        ? colors.primary 
                        : 'transparent',
                  },
                  pinError && styles.dotError,
                ]}
              />
            );
          })}
        </View>

        {/* Keypad */}
        <View style={styles.keypadContainer}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete']
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key, keyIndex) => {
                if (key === '') {
                  return <View key={keyIndex} style={styles.keypadButtonPlaceholder} />;
                }
                if (key === 'delete') {
                  return (
                    <TouchableOpacity
                      key={keyIndex}
                      style={[styles.keypadButton, { backgroundColor: colors.backgroundElement }]}
                      onPress={handleDeletePress}
                    >
                      <Delete size={24} color={colors.text} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={[styles.keypadButton, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={[styles.keypadButtonText, { color: colors.text }]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // 2. Main Navigation Routing Switch
  // Declare Stack screens unconditionally to satisfy Expo Router layout rules
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="diary-detail" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MoodProvider>
        <RootLayoutContent />
      </MoodProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lockHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lockIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  lockTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 50,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dotError: {
    transform: [{ scale: 1.1 }],
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  keypadButton: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  keypadButtonPlaceholder: {
    flex: 1,
    aspectRatio: 1.2,
  },
  keypadButtonText: {
    fontSize: 26,
    fontFamily: 'Outfit_600SemiBold',
  },
});
