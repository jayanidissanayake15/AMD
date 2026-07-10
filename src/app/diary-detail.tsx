import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  useColorScheme,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMood, MoodType, MoodEntry } from '../context/MoodContext';
import { Colors } from '../constants/theme';
import { Heart, ArrowLeft, Trash2, Check, Star } from 'lucide-react-native';

const MOODS_LIST: Array<{ type: MoodType; emoji: string; label: string; color: string }> = [
  { type: 'great', emoji: '😊', label: 'Great', color: '#10B981' },
  { type: 'good', emoji: '🙂', label: 'Good', color: '#34D399' },
  { type: 'okay', emoji: '😐', label: 'Okay', color: '#60A5FA' },
  { type: 'anxious', emoji: '😟', label: 'Anxious', color: '#FBBF24' },
  { type: 'stressed', emoji: '🥵', label: 'Stressed', color: '#F97316' },
  { type: 'difficult', emoji: '😔', label: 'Difficult', color: '#FB7185' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#60A5FA' }
];

const CATEGORIES_LIST = [
  { id: 'education', label: '📚 Education & Study' },
  { id: 'family', label: '👨‍👩‍👧 Family & Expectations' },
  { id: 'relationships', label: '❤️ Relationships & Heart' },
  { id: 'finance', label: '💰 Money & Cost Concerns' },
  { id: 'mentalPressure', label: '😟 Pressure & Overthinking' },
  { id: 'general', label: '🌱 General Thoughts' }
];

export default function DiaryDetailScreen() {
  const { entryId, preselectedMood } = useLocalSearchParams();
  const { moods, createMood, updateMood, deleteMood } = useMood();
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const isEditMode = !!entryId;
  
  // Form states
  const [selectedMood, setSelectedMood] = useState<MoodType>('okay');
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [noteText, setNoteText] = useState<string>('');

  // Pre-populate fields in Edit mode or with parameters
  useEffect(() => {
    if (isEditMode) {
      const entry = moods.find(m => m.id === entryId);
      if (entry) {
        setSelectedMood(entry.moodType);
        setStressLevel(entry.stressLevel);
        setSelectedCategory(entry.category);
        setNoteText(entry.note);
      }
    } else if (preselectedMood) {
      setSelectedMood(preselectedMood as MoodType);
    }
  }, [entryId, preselectedMood, moods]);

  const handleSave = async () => {
    try {
      if (isEditMode) {
        // UPDATE (U in CRUD)
        await updateMood(entryId as string, {
          moodType: selectedMood,
          stressLevel,
          category: selectedCategory,
          note: noteText.trim()
        });
      } else {
        // CREATE (C in CRUD)
        await createMood({
          moodType: selectedMood,
          stressLevel,
          category: selectedCategory,
          note: noteText.trim()
        });
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Could not save mood log entry. Please try again.');
    }
  };

  const handleDelete = () => {
    // DELETE (D in CRUD)
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently remove this mood log?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMood(entryId as string);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Could not delete entry.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Detail Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerActionBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? 'Edit Mood Log' : 'Log Today\'s Feelings'}
        </Text>
        {isEditMode ? (
          <TouchableOpacity onPress={handleDelete} style={styles.headerActionBtn}>
            <Trash2 size={20} color={colors.accent} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerActionBtnPlaceholder} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Mood Selector Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How do you feel?</Text>
          <View style={styles.moodGrid}>
            {MOODS_LIST.map((m) => {
              const isSelected = selectedMood === m.type;
              return (
                <TouchableOpacity
                  key={m.type}
                  style={[
                    styles.moodItem,
                    { 
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                  onPress={() => setSelectedMood(m.type)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stress Level Select (1-5 Star Picker) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stress & Anxiety Level</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            How heavy is the tension today? (1 = serene, 5 = extremely high)
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((val) => {
              const isHighlighted = val <= stressLevel;
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => setStressLevel(val)}
                  style={styles.starBtn}
                >
                  <Star 
                    size={36} 
                    color={isHighlighted ? (stressLevel > 3 ? colors.accent : colors.primary) : colors.border} 
                    fill={isHighlighted ? (stressLevel > 3 ? colors.accent : colors.primary) : 'transparent'} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Focus Concern Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Category</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            What area of your life is generating these feelings?
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES_LIST.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    { 
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[
                    styles.categoryText, 
                    { color: isSelected ? '#FFFFFF' : colors.text }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Text Note Journal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reflections & Journal Notes</Text>
          <TextInput
            style={[
              styles.noteInput, 
              { 
                color: colors.text, 
                backgroundColor: colors.card, 
                borderColor: colors.border 
              }
            ]}
            placeholder="Write down any thoughts, worries, or details. This space is entirely private..."
            placeholderTextColor={colors.textSecondary}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={6}
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        {/* Save CTA */}
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {isEditMode ? 'Update Journal Entry' : 'Log Feelings'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerActionBtn: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerActionBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: -4,
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  moodItem: {
    flex: 1,
    minWidth: '28%',
    aspectRatio: 1.15,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  starRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  starBtn: {
    padding: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  noteInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 140,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
});
