import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  useColorScheme, 
  StatusBar,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useMood, MoodEntry, MoodType } from '../../context/MoodContext';
import { Colors } from '../../constants/theme';
import { Plus, BookOpen, AlertCircle, Filter, Calendar } from 'lucide-react-native';

const MOODS_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  great: { emoji: '😊', label: 'Great', color: '#10B981' },
  good: { emoji: '🙂', label: 'Good', color: '#34D399' },
  okay: { emoji: '😐', label: 'Okay', color: '#60A5FA' },
  anxious: { emoji: '😟', label: 'Anxious', color: '#FBBF24' },
  stressed: { emoji: '🥵', label: 'Stressed', color: '#F97316' },
  difficult: { emoji: '😔', label: 'Difficult', color: '#FB7185' },
  sad: { emoji: '😢', label: 'Sad', color: '#60A5FA' }
};

const CATEGORIES_CONFIG: Record<string, string> = {
  education: '📚 Education',
  family: '👨‍👩‍👧 Family',
  relationships: '❤️ Relationships',
  finance: '💰 Finance',
  mentalPressure: '😟 Mental Pressure',
  general: '🌱 General'
};

export default function DiaryScreen() {
  const { moods } = useMood();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Filter logic
  const filteredMoods = selectedFilter === 'all' 
    ? moods 
    : moods.filter(m => m.category === selectedFilter);

  // Stats calculation
  const totalEntries = moods.length;
  
  const avgStress = moods.length > 0 
    ? (moods.reduce((acc, m) => acc + m.stressLevel, 0) / moods.length).toFixed(1) 
    : '0.0';

  const getFrequentMood = () => {
    if (moods.length === 0) return 'None';
    const counts: Record<string, number> = {};
    moods.forEach(m => {
      counts[m.moodType] = (counts[m.moodType] || 0) + 1;
    });
    
    let maxType: MoodType = 'okay';
    let maxCount = 0;
    
    Object.entries(counts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type as MoodType;
      }
    });
    return MOODS_CONFIG[maxType]?.emoji + ' ' + MOODS_CONFIG[maxType]?.label;
  };

  const getStressAdvice = (stress: number) => {
    if (stress === 0) return 'No entries logged yet.';
    if (stress <= 2.0) return 'Your stress is generally low. Keep up the healthy habits!';
    if (stress <= 3.5) return 'Moderate stress. Take small breaks and practice deep breathing.';
    return 'High average stress levels. Consider talking to Hitha, or reaching out to a professional.';
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMoodItem = ({ item }: { item: MoodEntry }) => {
    const config = MOODS_CONFIG[item.moodType] || MOODS_CONFIG.okay;
    return (
      <TouchableOpacity 
        style={[styles.moodItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/diary-detail', params: { entryId: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardEmoji}>{config.emoji}</Text>
            <View>
              <Text style={[styles.cardMoodText, { color: colors.text }]}>{config.label}</Text>
              <Text style={[styles.cardDateText, { color: colors.textSecondary }]}>
                {formatDate(item.date)} • {formatTime(item.date)}
              </Text>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.text }]}>
              {CATEGORIES_CONFIG[item.category] || item.category}
            </Text>
          </View>
        </View>

        {item.note.trim().length > 0 && (
          <Text 
            style={[styles.cardNote, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.note}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.stressLabelText, { color: colors.textSecondary }]}>Stress Level:</Text>
          <View style={styles.dotsWrapper}>
            {[1, 2, 3, 4, 5].map((val) => (
              <View 
                key={val} 
                style={[
                  styles.stressDot, 
                  { 
                    backgroundColor: val <= item.stressLevel 
                      ? item.stressLevel > 3.5 
                        ? colors.accent 
                        : colors.primary 
                      : colors.backgroundElement 
                  }
                ]} 
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Top Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <BookOpen size={20} color={colors.primary} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Mood Journal</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Reflect and notice patterns</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/diary-detail')}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Log Mood</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Card */}
      <View style={styles.statsWrapper}>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalEntries}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Logs</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{avgStress}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Stress</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {getFrequentMood()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Common Mood</Text>
            </View>
          </View>
          
          <View style={[styles.adviceBox, { backgroundColor: colors.backgroundElement }]}>
            <AlertCircle size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={[styles.adviceText, { color: colors.text }]}>
              {getStressAdvice(parseFloat(avgStress))}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Horizontal List */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[
              styles.filterPill, 
              { backgroundColor: selectedFilter === 'all' ? colors.primary : colors.card, borderColor: colors.border }
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterPillText, { color: selectedFilter === 'all' ? '#FFFFFF' : colors.text }]}>All</Text>
          </TouchableOpacity>
          
          {Object.entries(CATEGORIES_CONFIG).map(([key, label]) => (
            <TouchableOpacity 
              key={key}
              style={[
                styles.filterPill, 
                { backgroundColor: selectedFilter === key ? colors.primary : colors.card, borderColor: colors.border }
              ]}
              onPress={() => setSelectedFilter(key)}
            >
              <Text style={[styles.filterPillText, { color: selectedFilter === key ? '#FFFFFF' : colors.text }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mood Entry Logs List */}
      <FlatList
        data={filteredMoods}
        renderItem={renderMoodItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No entries found</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
              {selectedFilter === 'all' 
                ? "Your diary is currently empty. Tap 'Log Mood' above to save how you're feeling!"
                : "You don't have any entries categorized under this topic yet."}
            </Text>
          </View>
        }
      />
      
      {/* Extra spacer for floating tabbar */}
      <View style={{ height: 90 }} />
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  statsWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
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
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  adviceBox: {
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  adviceText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    flex: 1,
    lineHeight: 16,
  },
  filterWrapper: {
    marginTop: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  moodItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardMoodText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  cardDateText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 1,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  cardNote: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
    marginTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.08)',
  },
  stressLabelText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    marginRight: 10,
  },
  dotsWrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  stressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
