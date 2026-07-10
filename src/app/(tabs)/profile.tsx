import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  useColorScheme,
  StatusBar,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LocalStorage, STORAGE_KEYS } from '../../services/storage';
import { Colors } from '../../constants/theme';
import { 
  User, 
  Lock, 
  Key, 
  ShieldAlert, 
  LogOut, 
  Database, 
  Cpu, 
  PhoneCall,
  ChevronRight
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, isPinSetup, setupPin, disablePin } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [pinToggle, setPinToggle] = useState(isPinSetup);
  const [pinInput, setPinInput] = useState('');
  const [showPinInputArea, setShowPinInputArea] = useState(false);

  const [useLiveAI, setUseLiveAI] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'chatgpt'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKeyInputArea, setShowKeyInputArea] = useState(false);

  useEffect(() => {
    setPinToggle(isPinSetup);
  }, [isPinSetup]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await LocalStorage.getItem<{ useLiveAI?: boolean; apiKey?: string; aiProvider?: 'gemini' | 'chatgpt' }>(STORAGE_KEYS.SETTINGS);
    if (settings) {
      setUseLiveAI(!!settings.useLiveAI);
      setApiKey(settings.apiKey || '');
      setAiProvider(settings.aiProvider || 'gemini');
    }
  };

  const handlePinToggleChange = async (value: boolean) => {
    if (value) {
      // Prompt user to enter a new 4 digit PIN
      setShowPinInputArea(true);
      setPinInput('');
    } else {
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to disable the PIN passcode lock?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setPinToggle(true) },
          { 
            text: 'Disable', 
            style: 'destructive', 
            onPress: async () => {
              await disablePin();
              setPinToggle(false);
              setShowPinInputArea(false);
            }
          }
        ]
      );
    }
  };

  const handleSavePin = async () => {
    const trimmedPin = pinInput.trim();
    if (trimmedPin.length !== 4 || isNaN(Number(trimmedPin))) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric passcode.');
      return;
    }
    await setupPin(trimmedPin);
    setShowPinInputArea(false);
    setPinInput('');
    Alert.alert('Lock Configured', 'Passcode lock has been enabled.');
  };

  const handleAiToggleChange = async (value: boolean) => {
    setUseLiveAI(value);
    const settings = await LocalStorage.getItem<{ useLiveAI?: boolean; apiKey?: string; aiProvider?: 'gemini' | 'chatgpt' }>(STORAGE_KEYS.SETTINGS) || {};
    settings.useLiveAI = value;
    await LocalStorage.setItem(STORAGE_KEYS.SETTINGS, settings);
    
    if (value && !apiKey.trim()) {
      setShowKeyInputArea(true);
    }
  };

  const handleAiProviderChange = async (provider: 'gemini' | 'chatgpt') => {
    setAiProvider(provider);
    const settings = await LocalStorage.getItem<{ useLiveAI?: boolean; apiKey?: string; aiProvider?: 'gemini' | 'chatgpt' }>(STORAGE_KEYS.SETTINGS) || {};
    settings.aiProvider = provider;
    await LocalStorage.setItem(STORAGE_KEYS.SETTINGS, settings);
  };

  const handleSaveApiKey = async () => {
    const trimmedKey = apiKey.trim();
    const settings = await LocalStorage.getItem<{ useLiveAI?: boolean; apiKey?: string; aiProvider?: 'gemini' | 'chatgpt' }>(STORAGE_KEYS.SETTINGS) || {};
    settings.apiKey = trimmedKey;
    settings.useLiveAI = useLiveAI;
    await LocalStorage.setItem(STORAGE_KEYS.SETTINGS, settings);
    setShowKeyInputArea(false);
    Alert.alert('Key Saved', 'API Key has been configured successfully.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Hitha?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Purge Local Database',
      'WARNING: This will permanently delete all your mood history, chat logs, goals, and profiles. You will be logged out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All My Data', 
          style: 'destructive',
          onPress: async () => {
            await LocalStorage.clearAll();
            logout();
          }
        }
      ]
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <User size={20} color={colors.primary} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Security</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Configure privacy preferences</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarBigText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              <Text style={[styles.profileDate, { color: colors.textSecondary }]}>
                Member since {formatDate(user?.createdDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Settings Section */}
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Privacy & Passcode</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrapper}>
              <Lock size={18} color={colors.text} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>App Passcode Lock</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Require 4-digit PIN on app launch
                </Text>
              </View>
            </View>
            <Switch
              value={pinToggle}
              onValueChange={handlePinToggleChange}
              trackColor={{ false: colors.backgroundSelected, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Passcode Entry Sub-area */}
          {showPinInputArea && (
            <View style={[styles.subArea, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.subAreaLabel, { color: colors.text }]}>Configure New PIN:</Text>
              <View style={styles.subAreaRow}>
                <TextInput
                  style={[styles.numericInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. 1234"
                  placeholderTextColor={colors.textSecondary}
                  value={pinInput}
                  onChangeText={setPinInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
                <TouchableOpacity style={[styles.subAreaBtn, { backgroundColor: colors.primary }]} onPress={handleSavePin}>
                  <Text style={styles.subAreaBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* AI Model Setting Section */}
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>AI Companion Engine</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrapper}>
              <Cpu size={18} color={colors.text} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Live Google Gemini API</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Switch from offline engine to Gemini model
                </Text>
              </View>
            </View>
            <Switch
              value={useLiveAI}
              onValueChange={handleAiToggleChange}
              trackColor={{ false: colors.backgroundSelected, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {useLiveAI && (
            <View style={[styles.providerSelector, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 14 }]}>
              <Text style={[styles.settingTitle, { color: colors.text, marginBottom: 8 }]}>Select AI Model:</Text>
              <View style={styles.providerRow}>
                <TouchableOpacity
                  style={[
                    styles.providerPill,
                    { 
                      backgroundColor: aiProvider === 'gemini' ? colors.primary : colors.backgroundElement,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleAiProviderChange('gemini')}
                >
                  <Text style={[styles.providerPillText, { color: aiProvider === 'gemini' ? '#FFFFFF' : colors.text }]}>
                    Google Gemini
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.providerPill,
                    { 
                      backgroundColor: aiProvider === 'chatgpt' ? colors.primary : colors.backgroundElement,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleAiProviderChange('chatgpt')}
                >
                  <Text style={[styles.providerPillText, { color: aiProvider === 'chatgpt' ? '#FFFFFF' : colors.text }]}>
                    OpenAI ChatGPT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {useLiveAI && (
            <TouchableOpacity 
              style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 14 }]}
              onPress={() => setShowKeyInputArea(!showKeyInputArea)}
            >
              <View style={styles.settingLabelWrapper}>
                <Key size={18} color={colors.text} />
                <View>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {aiProvider === 'chatgpt' ? 'ChatGPT API Key' : 'Gemini API Key'}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    {apiKey ? '••••••••••••••••' : 'No API key configured'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* API Key Sub-area */}
          {useLiveAI && showKeyInputArea && (
            <View style={[styles.subArea, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.subAreaLabel, { color: colors.text }]}>
                Enter {aiProvider === 'chatgpt' ? 'ChatGPT (sk-...)' : 'Gemini'} API Key:
              </Text>
              <View style={styles.subAreaRow}>
                <TextInput
                  style={[styles.keyInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder={aiProvider === 'chatgpt' ? 'sk-...' : 'AIzaSy...'}
                  placeholderTextColor={colors.textSecondary}
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <TouchableOpacity style={[styles.subAreaBtn, { backgroundColor: colors.secondary }]} onPress={handleSaveApiKey}>
                  <Text style={styles.subAreaBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Crisis Support Lines Directory */}
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Crisis Support & Resources</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.crisisIntro, { color: colors.textSecondary }]}>
            If you need immediate support, please contact these free, anonymous, and confidential lines:
          </Text>

          <View style={styles.crisisRow}>
            <PhoneCall size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.crisisName, { color: colors.text }]}>Sri Lanka CCC Helpline</Text>
              <Text style={[styles.crisisNum, { color: colors.accent }]}>Call 1333</Text>
            </View>
          </View>
          
          <View style={[styles.crisisRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <PhoneCall size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.crisisName, { color: colors.text }]}>Sri Lanka Sumithrayo Helpline</Text>
              <Text style={[styles.crisisNum, { color: colors.accent }]}>Call 011-2696666</Text>
            </View>
          </View>

          <View style={[styles.crisisRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <PhoneCall size={16} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.crisisName, { color: colors.text }]}>National Mental Health Helpline</Text>
              <Text style={[styles.crisisNum, { color: colors.accent }]}>Call 1926</Text>
            </View>
          </View>
        </View>

        {/* Critical System Actions */}
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Account Actions</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <LogOut size={18} color={colors.text} />
            <Text style={[styles.actionTitle, { color: colors.text }]}>Sign Out of Hitha</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 14 }]} 
            onPress={handleClearData}
          >
            <Database size={18} color={colors.accent} />
            <Text style={[styles.actionTitle, { color: colors.accent }]}>Clear All App Data</Text>
          </TouchableOpacity>
        </View>

        {/* Extra spacing for tab bar padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: -2,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBigText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  profileDate: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  groupTitle: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  settingDesc: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  subArea: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  subAreaLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  subAreaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  numericInput: {
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    width: 100,
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  keyInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    paddingHorizontal: 10,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
  },
  subAreaBtn: {
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  subAreaBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
  },
  crisisIntro: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 16,
    marginBottom: 14,
  },
  crisisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  crisisName: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  crisisNum: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  providerSelector: {
    marginBottom: 6,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  providerPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  providerPillText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
});
