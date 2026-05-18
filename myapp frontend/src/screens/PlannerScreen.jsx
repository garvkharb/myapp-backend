import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generatePlan as generatePlanApi,
  generateGeneticTimetable,
  getLatestPlan,
} from '../services/api';
import Colors from '../theme/colors';

export default function PlannerScreen() {
  const [subjects, setSubjects] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [profileSubjects, setProfileSubjects] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [hoursDay, setHoursDay] = useState('');
  const [plan, setPlan] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [existingPlan, setExistingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');
  const [planStarted, setPlanStarted] = useState(false);

  useEffect(() => {
    loadProfileSubjects();
    checkExistingPlan();
  }, []);

  const loadProfileSubjects = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.subjects && parsed.subjects.length > 0) {
          setProfileSubjects(parsed.subjects);
        }
      }
    } catch (e) {
      console.log('Could not load profile subjects:', e.message);
    }
  };

  const checkExistingPlan = async () => {
    try {
      const data = await getLatestPlan();
      if (data && data.id) {
        setExistingPlan(data);
      }
    } catch (e) {
      // No existing plan
    } finally {
      setCheckingPlan(false);
    }
  };

  const toggleSubject = (subject) => {
    const updated = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(updated);
    setSubjects(updated.join(', '));
  };

  const removeSubject = (subject) => {
    const updated = selectedSubjects.filter(s => s !== subject);
    setSelectedSubjects(updated);
    setSubjects(updated.join(', '));
  };

  const getSubjectList = () => {
    if (selectedSubjects.length > 0) return selectedSubjects;
    return subjects.split(',').map(s => s.trim()).filter(Boolean);
  };

  const confirmAndGenerate = (generateFn) => {
    if (existingPlan) {
      Alert.alert(
        '⚠️ Active Plan Exists',
        'You already have an active study plan. Starting a new plan will reset your current progress. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset & Start New', style: 'destructive', onPress: () => generateFn() },
        ]
      );
    } else {
      generateFn();
    }
  };

  const generateAIPlan = async () => {
    const subjectList = getSubjectList();
    if (subjectList.length === 0) return Alert.alert('Select Subjects', 'Please select at least one subject.');
    if (!examDate || !hoursDay) return Alert.alert('Missing Fields', 'Please fill in exam date and study hours.');
    setLoading(true);
    setPlan(null);
    setTimetable(null);
    setPlanStarted(false);
    try {
      const result = await generatePlanApi({
        subjects: subjectList,
        exam_date: examDate,
        daily_hours: Number(hoursDay),
      });
      setPlan(result.plan);
      setExistingPlan({ id: result.id });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateGeneticPlan = async () => {
    const subjectList = getSubjectList();
    if (subjectList.length === 0) return Alert.alert('Select Subjects', 'Please select at least one subject.');
    if (!examDate || !hoursDay) return Alert.alert('Missing Fields', 'Please fill in exam date and study hours.');
    setLoading(true);
    setPlan(null);
    setTimetable(null);
    setPlanStarted(false);
    try {
      const result = await generateGeneticTimetable({
        subjects: subjectList,
        exam_date: examDate,
        daily_hours: Number(hoursDay),
      });
      setTimetable(result.timetable);
      setExistingPlan({ id: result.id });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = () => {
    setPlanStarted(true);
    Alert.alert(
      '🚀 Plan Started!',
      'Your study plan is now active. Track your progress in the Progress tab!',
      [{ text: 'OK' }]
    );
  };

  const getDayColor = (weekday) => {
    const colors = {
      Monday: '#6c63ff', Tuesday: '#f97316', Wednesday: '#22c55e',
      Thursday: '#3b82f6', Friday: '#ec4899', Saturday: '#f59e0b', Sunday: '#ef4444',
    };
    return colors[weekday] || Colors.accent;
  };

  if (checkingPlan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>🗓️ Study Planner</Text>

          {/* Existing plan warning banner */}
          {existingPlan && !plan && !timetable && (
            <View style={styles.existingBanner}>
              <Text style={styles.existingIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.existingTitle}>Active Plan Running</Text>
                <Text style={styles.existingSubtitle}>
                  Creating a new plan will reset your current progress.
                </Text>
              </View>
            </View>
          )}

          {/* Tab selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ai' && styles.tabActive]}
              onPress={() => setActiveTab('ai')}>
              <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>
                🤖 AI Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'genetic' && styles.tabActive]}
              onPress={() => setActiveTab('genetic')}>
              <Text style={[styles.tabText, activeTab === 'genetic' && styles.tabTextActive]}>
                🧬 Genetic Algorithm
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Subject label */}
            <Text style={styles.label}>Subjects</Text>

            {/* Dropdown trigger — only if profile subjects exist */}
            {profileSubjects.length > 0 && (
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setDropdownVisible(true)}>
                <Text style={styles.dropdownTriggerText}>
                  {selectedSubjects.length > 0
                    ? `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected ▾`
                    : '📚 Select from your profile subjects ▾'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Selected subject chips */}
            {selectedSubjects.length > 0 && (
              <View style={styles.chipRow}>
                {selectedSubjects.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.chip}
                    onPress={() => removeSubject(s)}>
                    <Text style={styles.chipText}>{s}  ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Manual text input */}
            {profileSubjects.length === 0 && (
              <TextInput
                style={styles.input}
                placeholder="e.g. Math, Physics, English"
                placeholderTextColor={Colors.muted}
                value={subjects}
                onChangeText={setSubjects}
              />
            )}

            {/* OR divider + manual input when profile subjects exist but none selected */}
            {profileSubjects.length > 0 && selectedSubjects.length === 0 && (
              <>
                <Text style={styles.orText}>— or type manually —</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Math, Physics, English"
                  placeholderTextColor={Colors.muted}
                  value={subjects}
                  onChangeText={setSubjects}
                />
              </>
            )}

            <Text style={styles.label}>Exam Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-06-15"
              placeholderTextColor={Colors.muted}
              value={examDate}
              onChangeText={setExamDate}
            />

            <Text style={styles.label}>Study Hours per Day</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4"
              placeholderTextColor={Colors.muted}
              value={hoursDay}
              onChangeText={setHoursDay}
              keyboardType="numeric"
            />

            {activeTab === 'ai' ? (
              <TouchableOpacity
                style={styles.genBtn}
                onPress={() => confirmAndGenerate(generateAIPlan)}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.genText}>✨ Generate AI Study Plan</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.genBtn, { backgroundColor: '#22c55e' }]}
                onPress={() => confirmAndGenerate(generateGeneticPlan)}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.genText}>🧬 Optimize with Genetic Algorithm</Text>}
              </TouchableOpacity>
            )}
          </View>

          {/* Genetic Algorithm info box */}
          {activeTab === 'genetic' && !timetable && !loading && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🧬 How Genetic Algorithm Works</Text>
              <Text style={styles.infoText}>
                {'• Creates 20 random study schedules\n• Runs 50 generations of evolution\n• Selects best schedules (survival of fittest)\n• Combines and mutates schedules\n• Prioritizes your weak subjects (from KNN)\n• Returns the most optimized timetable!'}
              </Text>
            </View>
          )}

          {/* AI Plan result */}
          {plan && (
            <View style={styles.planBox}>
              <Text style={styles.planTitle}>🤖 AI Generated Study Plan</Text>
              {(() => {
                const weeks = plan?.weekly_plan || [];
                if (weeks.length === 0) {
                  return <Text style={styles.planText}>{plan?.raw || JSON.stringify(plan)}</Text>;
                }
                return weeks.map((week, wi) => (
                  <View key={wi} style={styles.weekBlock}>
                    <Text style={styles.weekTitle}>Week {week.week} — {week.focus}</Text>
                    {(week.tasks || []).map((task, ti) => (
                      <View key={ti} style={styles.taskCard}>
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskDay}>📅 Day {task.day_number} — {task.day}</Text>
                          <Text style={styles.taskHours}>{task.duration_hours}h</Text>
                        </View>
                        <Text style={styles.taskSubject}>{task.subject}</Text>
                        <Text style={styles.taskTopic}>📖 {task.topic}</Text>
                        {(task.subtopics || []).map((s, si) => (
                          <Text key={si} style={styles.taskSubtopic}>• {s}</Text>
                        ))}
                        {task.description && (
                          <Text style={styles.taskDesc}>{task.description}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ));
              })()}

              {!planStarted ? (
                <TouchableOpacity style={styles.startBtn} onPress={handleStartPlan}>
                  <Text style={styles.startBtnText}>▶  Start This Plan</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.startedBadge}>
                  <Text style={styles.startedBadgeText}>✅  Plan Active — Track in Progress Tab</Text>
                </View>
              )}
            </View>
          )}

          {/* Genetic Timetable result */}
          {timetable && timetable.timetable && (
            <View>
              <View style={styles.gaHeader}>
                <Text style={styles.gaTitle}>🧬 Optimized Timetable</Text>
                <Text style={styles.gaMeta}>{timetable.days_planned} days planned</Text>
              </View>

              {/* Subject hours summary */}
              {timetable.subject_hours && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>📊 Hours per Subject</Text>
                  {Object.entries(timetable.subject_hours).map(([subj, hrs]) => (
                    <View key={subj} style={styles.summaryRow}>
                      <Text style={styles.summarySubject}>{subj}</Text>
                      <View style={styles.summaryTrack}>
                        <View style={[styles.summaryFill, {
                          width: `${Math.min((hrs / (Number(hoursDay) * timetable.days_planned)) * 100, 100)}%`
                        }]} />
                      </View>
                      <Text style={styles.summaryHrs}>{hrs.toFixed(1)}h</Text>
                    </View>
                  ))}
                  {timetable.weak_subjects_prioritized?.length > 0 && (
                    <Text style={styles.weakNote}>
                      ⚡ KNN weak subjects prioritized: {timetable.weak_subjects_prioritized.join(', ')}
                    </Text>
                  )}
                </View>
              )}

              {/* Start Plan Button */}
              {!planStarted ? (
                <TouchableOpacity style={styles.startBtn} onPress={handleStartPlan}>
                  <Text style={styles.startBtnText}>▶  Start This Plan</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.startedBadge}>
                  <Text style={styles.startedBadgeText}>✅  Plan Active — Track in Progress Tab</Text>
                </View>
              )}

              {/* Day by day timetable */}
              {timetable.timetable.slice(0, 14).map((day) => (
                <View key={day.day} style={styles.dayCard}>
                  <View style={[styles.dayHeader, {
                    backgroundColor: getDayColor(day.weekday) + '22',
                    borderColor: getDayColor(day.weekday) + '44',
                  }]}>
                    <Text style={[styles.dayNum, { color: getDayColor(day.weekday) }]}>Day {day.day}</Text>
                    <Text style={styles.dayDate}>{day.weekday}, {day.date}</Text>
                    <Text style={styles.dayHours}>{day.total_hours}h</Text>
                  </View>
                  <View style={styles.daySessions}>
                    {day.sessions.map((session, i) => (
                      <View key={i} style={styles.sessionDetail}>
                        <View style={styles.sessionDetailHeader}>
                          <View style={[styles.sessionDot, { backgroundColor: getDayColor(day.weekday) }]} />
                          <Text style={styles.sessionSubject}>{session.subject}</Text>
                          <Text style={styles.sessionHours}>{session.hours}h</Text>
                        </View>
                        {session.topic && (
                          <Text style={styles.sessionTopic}>📖 {session.topic}</Text>
                        )}
                        {session.what_to_do && session.what_to_do.length > 0 && (
                          <View style={styles.sessionTodos}>
                            {session.what_to_do.map((item, wi) => (
                              <Text key={wi} style={styles.sessionTodoItem}>• {item}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {timetable.timetable.length > 14 && (
                <Text style={styles.moreText}>
                  + {timetable.timetable.length - 14} more days...
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Subject Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📚 Select Your Subjects</Text>
            <Text style={styles.modalSubtitle}>
              Tap to select / deselect. From your profile.
            </Text>
            <FlatList
              data={profileSubjects}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedSubjects.includes(item);
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => toggleSubject(item)}>
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                      {item}
                    </Text>
                    {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalDone}
              onPress={() => setDropdownVisible(false)}>
              <Text style={styles.modalDoneText}>
                Done — {selectedSubjects.length} selected
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.bright, marginBottom: 16 },

  existingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f9731618', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#f9731644', marginBottom: 16,
  },
  existingIcon: { fontSize: 24 },
  existingTitle: { fontSize: 14, fontWeight: '800', color: '#f97316', marginBottom: 2 },
  existingSubtitle: { fontSize: 11, color: Colors.muted, lineHeight: 16 },

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
  tabTextActive: { color: Colors.white },

  form: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.border, gap: 12, marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 13,
    color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 14,
  },

  dropdownTrigger: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 13,
    borderWidth: 1, borderColor: Colors.accent + '66',
  },
  dropdownTriggerText: { fontSize: 14, color: Colors.accent, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.accent + '22', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '55',
  },
  chipText: { fontSize: 12, color: Colors.accent, fontWeight: '700' },

  orText: { textAlign: 'center', color: Colors.muted, fontSize: 11 },

  genBtn: {
    backgroundColor: Colors.accent, paddingVertical: 15,
    borderRadius: 12, alignItems: 'center', marginTop: 4,
  },
  genText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  startBtn: {
    backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 20, marginBottom: 8,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  startedBadge: {
    backgroundColor: '#22c55e18', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20, marginBottom: 8,
    borderWidth: 1, borderColor: '#22c55e44',
  },
  startedBadgeText: { color: '#22c55e', fontWeight: '700', fontSize: 14 },

  infoBox: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#22c55e44', marginBottom: 20,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#22c55e', marginBottom: 10 },
  infoText: { fontSize: 13, color: Colors.muted, lineHeight: 22 },

  planBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.accent + '44',
  },
  planTitle: { fontSize: 16, fontWeight: '700', color: Colors.accent, marginBottom: 12 },
  planText: { fontSize: 13, color: Colors.text, lineHeight: 22 },

  gaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gaTitle: { fontSize: 18, fontWeight: '800', color: Colors.bright },
  gaMeta: { fontSize: 12, color: Colors.muted },

  summaryBox: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  summarySubject: { width: 80, fontSize: 12, color: Colors.text },
  summaryTrack: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 6 },
  summaryFill: { height: 6, backgroundColor: '#22c55e', borderRadius: 6 },
  summaryHrs: { width: 35, fontSize: 11, color: Colors.muted, textAlign: 'right' },
  weakNote: { fontSize: 11, color: '#f97316', marginTop: 8, fontStyle: 'italic' },

  dayCard: {
    backgroundColor: Colors.card, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, gap: 8,
  },
  dayNum: { fontSize: 13, fontWeight: '800', width: 45 },
  dayDate: { flex: 1, fontSize: 12, color: Colors.text },
  dayHours: { fontSize: 12, color: Colors.muted, fontWeight: '700' },
  daySessions: { padding: 12, gap: 6 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionSubject: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
  sessionHours: { fontSize: 12, color: Colors.muted },
  moreText: { textAlign: 'center', color: Colors.muted, fontSize: 13, marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.bright, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: Colors.muted, marginBottom: 16 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    marginBottom: 6, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent + '66' },
  dropdownItemText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  dropdownItemTextActive: { color: Colors.accent },
  dropdownCheck: { fontSize: 16, color: Colors.accent, fontWeight: '800' },
  modalDone: {
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  modalDoneText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  
    // AI Plan styles
  weekBlock: { marginBottom: 20 },
  weekTitle: { fontSize: 14, fontWeight: '800', color: Colors.accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  taskCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  taskDay: { fontSize: 11, color: Colors.muted, fontWeight: '600' },
  taskHours: { fontSize: 11, color: Colors.muted },
  taskSubject: { fontSize: 14, fontWeight: '800', color: Colors.bright, marginBottom: 4 },
  taskTopic: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  taskSubtopic: { fontSize: 12, color: Colors.muted, lineHeight: 20 },
  taskDesc: { fontSize: 12, color: Colors.muted, marginTop: 6, lineHeight: 18, fontStyle: 'italic' },

  // Genetic session styles
  sessionDetail: { marginBottom: 10, backgroundColor: Colors.surface, borderRadius: 8, padding: 10 },
  sessionDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sessionTopic: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginBottom: 4, marginLeft: 16 },
  sessionTodos: { marginLeft: 16 },
  sessionTodoItem: { fontSize: 11, color: Colors.muted, lineHeight: 18 },
});