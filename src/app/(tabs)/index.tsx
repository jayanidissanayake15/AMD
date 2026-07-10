import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  useColorScheme, 
  StatusBar,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useMood, MoodType, StepGoal } from '../../context/MoodContext';
import { Colors } from '../../constants/theme';
import { 
  Heart, 
  Plus, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  LifeBuoy
} from 'lucide-react-native';

const MOODS_CONFIG: Array<{ type: MoodType; emoji: string; label: string; color: string }> = [
  { type: 'great', emoji: '😊', label: 'Great', color: '#10B981' },
  { type: 'good', emoji: '🙂', label: 'Good', color: '#34D399' },
  { type: 'okay', emoji: '😐', label: 'Okay', color: '#60A5FA' },
  { type: 'anxious', emoji: '😟', label: 'Anxious', color: '#FBBF24' },
  { type: 'stressed', emoji: '🥵', label: 'Stressed', color: '#F97316' },
  { type: 'difficult', emoji: '😔', label: 'Difficult', color: '#FB7185' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#60A5FA' }
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { moods, goals, createGoal, toggleGoal, deleteGoal } = useMood();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('general');

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    try {
      await createGoal(newGoalTitle, goalCategory);
      setNewGoalTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  // Get active goals (uncompleted)
  const activeGoals = goals.filter(g => !g.completed);
  // Get completed goals
  const completedGoals = goals.filter(g => g.completed);

  // Statistics calculation for the chart
  const getLast7DaysStats = () => {
    const stats = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayName = weekdayNames[d.getDay()];
      
      // Find moods entered on this day
      const dayMoods = moods.filter(m => new Date(m.date).toDateString() === dateStr);
      
      // Calculate average stress level (1-5) or default to 0
      let avgStress = 0;
      if (dayMoods.length > 0) {
        const sum = dayMoods.reduce((acc, m) => acc + m.stressLevel, 0);
        avgStress = sum / dayMoods.length;
      }
      
      stats.push({
        day: dayName,
        stress: avgStress,
        hasMood: dayMoods.length > 0
      });
    }
    return stats;
  };

  const chartData = getLast7DaysStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header Banner */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello, {user?.name || 'Friend'}</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>Let's find your center.</Text>
        </View>
        <TouchableOpacity 
          style={[styles.chatShortcut, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.chatShortcutText}>Talk to Hitha</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Mood Check-in Widget */}
        <View style={[styles.widgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling today?</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap a mood to log it in your private diary
          </Text>
          
          <View style={styles.moodGrid}>
            {MOODS_CONFIG.map((m) => (
              <TouchableOpacity
                key={m.type}
                style={[styles.moodItem, { backgroundColor: colors.backgroundElement }]}
                onPress={() => router.push({ pathname: '/diary-detail', params: { preselectedMood: m.type } })}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, { color: colors.text }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Trend Graph Card */}
        <View style={[styles.widgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Stress Tracker</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/diary')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View Journal</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 20 }]}>
            Your average stress level over the last 7 days (1 = low, 5 = high)
          </Text>

          {/* Bar Chart */}
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              {chartData.map((data, idx) => {
                // Height of bar represents stress level (1 to 5 maps to 20% to 100% height)
                const barHeight = data.hasMood ? (data.stress / 5) * 120 : 8;
                return (
                  <View key={idx} style={styles.chartColumn}>
                    <View style={styles.barTrack}>
                      <View 
                        style={[
                          styles.barFill, 
                          { 
                            height: barHeight, 
                            backgroundColor: data.hasMood 
                              ? data.stress > 3.5 
                                ? colors.accent 
                                : data.stress > 2 
                                  ? colors.primary 
                                  : colors.secondary
                              : colors.backgroundElement
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.chartDayText, { color: colors.textSecondary }]}>{data.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Small Steps Planner Card */}
        <View style={[styles.widgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Small Steps Planner</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Do not worry about the mountain. Just focus on the next step.
          </Text>

          {/* Goal Input Form */}
          <View style={styles.goalInputRow}>
            <TextInput
              style={[styles.goalInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              placeholder="Break down a task (e.g. Read 5 pages)"
              placeholderTextColor={colors.textSecondary}
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            <TouchableOpacity 
              style={[styles.addGoalBtn, { backgroundColor: colors.secondary }]}
              onPress={handleAddGoal}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Goals Checklist */}
          <View style={styles.goalsContainer}>
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={28} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  What is one tiny thing you can achieve today?
                </Text>
              </View>
            ) : (
              <>
                {/* Active Goals */}
                {activeGoals.map((g) => (
                  <View key={g.id} style={[styles.goalItem, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => toggleGoal(g.id)} style={styles.goalTextBtn}>
                      <Square size={20} color={colors.primary} />
                      <Text style={[styles.goalTitle, { color: colors.text }]}>{g.title}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteGoal(g.id)} style={styles.deleteGoalBtn}>
                      <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'Outfit_600SemiBold' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Completed Goals */}
                {completedGoals.map((g) => (
                  <View key={g.id} style={[styles.goalItem, { borderBottomColor: colors.border, opacity: 0.6 }]}>
                    <TouchableOpacity onPress={() => toggleGoal(g.id)} style={styles.goalTextBtn}>
                      <CheckSquare size={20} color={colors.secondary} />
                      <Text style={[styles.goalTitle, { color: colors.textSecondary, textDecorationLine: 'line-through' }]}>
                        {g.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteGoal(g.id)} style={styles.deleteGoalBtn}>
                      <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'Outfit_600SemiBold' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Safety Quick Link */}
        <View style={[styles.safetyBanner, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <LifeBuoy size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.safetyText, { color: colors.text }]}>Feeling highly distressed?</Text>
            <Text style={[styles.safetySubtext, { color: colors.textSecondary }]}>
              There are supportive, friendly people waiting to help. Check Crisis Lines in settings.
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.safetyActionBtn}>
            <ArrowRight size={18} color={colors.accent} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  tagline: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginTop: 2,
  },
  chatShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chatShortcutText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  scrollContainer: {
    padding: 20,
    gap: 20,
  },
  widgetCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  moodItem: {
    flex: 1,
    minWidth: '28%',
    aspectRatio: 1.1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  chartWrapper: {
    height: 140,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 8,
  },
  chartColumn: {
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    height: 120,
    width: 14,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartDayText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  goalInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 10,
  },
  goalInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  addGoalBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsContainer: {
    marginTop: 8,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  goalTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    flex: 1,
  },
  deleteGoalBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  safetyBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  safetyText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  safetySubtext: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
    lineHeight: 15,
  },
  safetyActionBtn: {
    padding: 6,
  },
});
