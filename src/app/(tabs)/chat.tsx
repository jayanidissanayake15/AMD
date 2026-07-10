import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LocalStorage, STORAGE_KEYS, SecureStorage } from '../../services/storage';
import { AIService, AIMessage, checkSafetyStatus } from '../../services/ai';
import { Colors } from '../../constants/theme';
import { Send, Heart, Trash2, LifeBuoy, X, Plus } from 'lucide-react-native';

export default function ChatScreen() {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'chatgpt' | null>('gemini');

  const flatListRef = useRef<FlatList>(null);
  const chatStorageKey = `${STORAGE_KEYS.CHATS}${user?.id}`;

  useEffect(() => {
    loadChatHistory();
    loadApiKey();
  }, [user]);

  const loadApiKey = async () => {
    const savedSettings = await LocalStorage.getItem<{ useLiveAI?: boolean; apiKey?: string; aiProvider?: 'gemini' | 'chatgpt' }>(STORAGE_KEYS.SETTINGS);
    if (savedSettings?.useLiveAI && savedSettings?.apiKey) {
      setApiKey(savedSettings.apiKey);
      setAiProvider(savedSettings.aiProvider || 'gemini');
    } else {
      setApiKey(null);
      setAiProvider(null);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const history = await LocalStorage.getItem<AIMessage[]>(chatStorageKey);
      if (history && history.length > 0) {
        // Convert ISO string dates back to Date objects
        const formattedHistory = history.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(formattedHistory);
      } else {
        // Add welcome message if chat history is empty
        const welcomeMessage: AIMessage = {
          sender: 'ai',
          text: `Hi ${user.name || 'there'}. I'm Hitha, your supportive space. Whatever is on your mind—whether it's pressure from studies, family, relationships, or just an overwhelming day—I'm here to listen. What is feeling the heaviest for you today?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        await LocalStorage.setItem(chatStorageKey, [welcomeMessage]);
      }
    } catch (err) {
      console.error('Error loading chat logs:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const userText = inputText.trim();
    setInputText('');

    // Check safety status on user's message
    const isDistressed = checkSafetyStatus(userText);
    if (isDistressed) {
      setShowSafetyBanner(true);
    }

    const newUserMessage: AIMessage = {
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    await LocalStorage.setItem(chatStorageKey, updatedMessages);

    // Scroll to end
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // AI typing state
    setIsTyping(true);

    try {
      // Get AI response
      const responseText = await AIService.getResponse(userText, updatedMessages, apiKey, aiProvider);
      
      // Check safety on response as well just in case
      if (checkSafetyStatus(responseText)) {
        setShowSafetyBanner(true);
      }

      const newAIMessage: AIMessage = {
        sender: 'ai',
        text: responseText,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, newAIMessage];
      setMessages(finalMessages);
      await LocalStorage.setItem(chatStorageKey, finalMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to delete all messages? This action is private and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const welcomeMessage: AIMessage = {
              sender: 'ai',
              text: `Hi ${user.name || 'there'}. I've reset our conversation space. How can I support you today?`,
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            await LocalStorage.setItem(chatStorageKey, [welcomeMessage]);
            setShowSafetyBanner(false);
          }
        }
      ]
    );
  };

  const renderMessageItem = ({ item }: { item: AIMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.aiRow
      ]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Heart size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser 
            ? [styles.userBubble, { backgroundColor: colors.primary }] 
            : [styles.aiBubble, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : colors.text }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timeText,
            { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Top Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Heart size={20} color={colors.primary} fill={colors.primary} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Hitha Companion</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Private AI Support</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={[styles.newChatBtn, { backgroundColor: colors.backgroundElement }]}>
          <Plus size={14} color={colors.primary} />
          <Text style={[styles.newChatBtnText, { color: colors.text }]}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Banner Notification */}
      {showSafetyBanner && (
        <View style={[styles.safetyBanner, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
          <LifeBuoy size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.safetyTitle, { color: colors.text }]}>We are here for you.</Text>
            <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
              If you are feeling overwhelmed or having thoughts of self-harm, please know you are not alone. Please dial 133 (Sri Lanka Crisis Support) or contact your local helpline.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSafetyBanner(false)} style={styles.closeSafetyBtn}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Heart size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <View style={[styles.typingBubble, { backgroundColor: colors.backgroundElement }]}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.typingText, { color: colors.textSecondary }]}>Hitha is listening...</Text>
          </View>
        </View>
      )}

      {/* Input Tray */}
      <View style={[styles.inputTray, { 
        backgroundColor: colors.background, 
        borderColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? 90 : 85 // Account for floating tab bar height
      }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type your feelings, fears, or goals..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.backgroundSelected }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearBtn: {
    padding: 8,
  },
  safetyBanner: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  safetyTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  safetyText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 15,
  },
  closeSafetyBtn: {
    padding: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiRow: {
    alignSelf: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  aiBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 9,
    fontFamily: 'Outfit_400Regular',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  typingText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  inputTray: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  newChatBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
});
