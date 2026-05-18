import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { getProgress, updateProgress, getLatestPlan } from '../services/api';
import Colors from '../theme/colors';

const StatCard = ({ label, value, color, icon }) => (
  <View style={[styles.statCard, { borderColor: color + '33' }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ProgressScreen() {
  const [data, setData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingTask, setMarkingTask] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [progressRes, planRes] = await Promise.all([
        getProgress(),
        getLatestPlan(),
      ]);
      setData(progressRes);
      setPlanData(planRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (taskId, hoursSpent) => {
    setMarkingTask(taskId);
    try {
      await updateProgress({ task_id: taskId, hours_spent: hoursSpent });
      // Refresh data
      const [progressRes] = await Promise.all([getProgress()]);
      setData(progressRes);
      Alert.alert('✅ Task Completed!', 'Great work! Keep it up!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setMarkingTask(null);
    }
  };

  const isTaskCompleted = (taskId) => {
    return data?.completed_tasks?.includes(taskId);
  };

  // Extract day tasks from plan
  const getDayTasks = () => {
    if (!planData?.plan) return [];

    const plan = planData.plan;

    // Genetic algorithm plan — has timetable array
    if (plan.timetable && Array.isArray(plan.timetable)) {
      return plan.timetable.map(day => ({
        dayNumber: day.day,
        date: day.date,
        weekday: day.weekday,
        totalHours: day.total_hours,
        taskId: day.task_id || `day_${day.day}`,
        sessions: day.sessions || [],
      }));
    }

    // AI plan — has weekly_plan with tasks
    if (plan.weekly_plan && Array.isArray(plan.weekly_plan)) {
      const allDays = [];
      plan.weekly_plan.forEach(week => {
        (week.tasks || []).forEach(task => {
          allDays.push({
            dayNumber: task.day_number || allDays.length + 1,
            date: task.date || '',
            weekday: task.day || '',
            totalHours: task.duration_hours || 0,
            taskId: task.id || `task_${allDays.length + 1}`,
            sessions: [{
              subject: task.subject,
              topic: task.topic,
              hours: task.duration_hours,
              description: task.description,
              what_to_do: task.subtopics
                ? task.subtopics.map(s => `• ${s}`)
                : [task.description],
            }],
          });
        });
      });
      return allDays;
    }

    return [];
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const completed = data?.completed_tasks?.length ?? 0;
  const total = data?.total_tasks ?? 0;
  const pct = data?.completion_pct ?? 0;
  const streak = data?.streak_days ?? 0;
  const hours = data?.total_hours ?? 0;
  const dayTasks = getDayTasks();

  // Today's index (find first incomplete day)
  const todayIndex = dayTasks.findIndex(d => !isTaskCompleted(d.taskId));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>📈 Progress Tracker</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="Days Completed" value={completed} color={Colors.green || '#22c55e'} icon="✅" />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Total Hours" value={`${hours}h`} color={Colors.accent} icon="⏱️" />
          </View>

          {/* Overall progress bar */}
          {total > 0 && (
            <View style={styles.overallBox}>
              <Text style={styles.sectionTitle}>Overall Completion</Text>
              <View style={styles.bigBarTrack}>
                <View style={[styles.bigBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.bigBarText}>{pct}%</Text>
            </View>
          )}

          {/* No plan state */}
          {dayTasks.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>📅 No study plan yet!</Text>
              <Text style={styles.emptySubText}>
                Go to Planner tab to generate your study plan first, then start it.
              </Text>
            </View>
          )}

          {/* Daily Tasks */}
          {dayTasks.length > 0 && (
            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>📋 Daily Tasks</Text>

              {dayTasks.map((day, index) => {
                const isDone = isTaskCompleted(day.taskId);
                const isToday = index === todayIndex;
                const isExpanded = expandedDay === day.taskId;

                return (
                  <View
                    key={day.taskId}
                    style={[
                      styles.dayCard,
                      isDone && styles.dayCardDone,
                      isToday && styles.dayCardToday,
                    ]}>

                    {/* Day Header */}
                    <TouchableOpacity
                      style={styles.dayCardHeader}
                      onPress={() => setExpandedDay(isExpanded ? null : day.taskId)}>
                      <View style={styles.dayCardLeft}>
                        <View style={[
                          styles.dayBadge,
                          isDone && styles.dayBadgeDone,
                          isToday && styles.dayBadgeToday,
                        ]}>
                          <Text style={styles.dayBadgeText}>
                            {isDone ? '✓' : `D${day.dayNumber}`}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.dayTitle, isDone && styles.dayTitleDone]}>
                            {isToday ? '📍 Today — ' : ''}{day.weekday}
                            {day.date ? `, ${day.date}` : ''}
                          </Text>
                          <Text style={styles.daySubtitle}>
                            {day.sessions.map(s => s.subject).join(' • ')} • {day.totalHours}h
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {/* Expanded content */}
                    {isExpanded && (
                      <View style={styles.dayCardBody}>
                        {day.sessions.map((session, si) => (
                          <View key={si} style={styles.sessionBox}>
                            <View style={styles.sessionHeader}>
                              <Text style={styles.sessionSubject}>{session.subject}</Text>
                              <Text style={styles.sessionHours}>{session.hours}h</Text>
                            </View>

                            {session.topic && (
                              <Text style={styles.sessionTopic}>📖 {session.topic}</Text>
                            )}

                            {session.description && (
                              <Text style={styles.sessionDesc}>{session.description}</Text>
                            )}

                            {session.what_to_do && session.what_to_do.length > 0 && (
                              <View style={styles.todoList}>
                                <Text style={styles.todoTitle}>What to do:</Text>
                                {session.what_to_do.map((item, wi) => (
                                  <Text key={wi} style={styles.todoItem}>• {item}</Text>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}

                        {/* Mark Done Button */}
                        {!isDone ? (
                          <TouchableOpacity
                            style={styles.markDoneBtn}
                            disabled={markingTask === day.taskId}
                            onPress={() => handleMarkDone(day.taskId, day.totalHours)}>
                            {markingTask === day.taskId
                              ? <ActivityIndicator color="#fff" />
                              : <Text style={styles.markDoneBtnText}>✅ Mark Day as Done</Text>}
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✅ Completed!</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.bright, marginBottom: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 2 },

  overallBox: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20, marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.muted,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12,
  },
  bigBarTrack: { height: 10, backgroundColor: Colors.surface, borderRadius: 10, marginTop: 10 },
  bigBarFill: { height: 10, backgroundColor: '#22c55e', borderRadius: 10 },
  bigBarText: { textAlign: 'right', color: '#22c55e', fontWeight: '700', fontSize: 13, marginTop: 6 },

  emptyBox: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 24,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginTop: 20,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.bright, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },

  tasksSection: { marginTop: 8 },

  dayCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10, overflow: 'hidden',
  },
  dayCardDone: { borderColor: '#22c55e44', backgroundColor: '#22c55e08' },
  dayCardToday: { borderColor: Colors.accent + '88', borderWidth: 2 },

  dayCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  dayCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },

  dayBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  dayBadgeDone: { backgroundColor: '#22c55e22', borderColor: '#22c55e' },
  dayBadgeToday: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  dayBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.text },

  dayTitle: { fontSize: 13, fontWeight: '700', color: Colors.bright, marginBottom: 2 },
  dayTitleDone: { color: Colors.muted },
  daySubtitle: { fontSize: 11, color: Colors.muted },
  expandArrow: { fontSize: 12, color: Colors.muted, paddingLeft: 8 },

  dayCardBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: Colors.border },

  sessionBox: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 12,
    marginTop: 12, borderWidth: 1, borderColor: Colors.border,
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sessionSubject: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  sessionHours: { fontSize: 12, color: Colors.muted, fontWeight: '700' },
  sessionTopic: { fontSize: 13, fontWeight: '600', color: Colors.bright, marginBottom: 6 },
  sessionDesc: { fontSize: 12, color: Colors.muted, lineHeight: 18, marginBottom: 8 },

  todoList: { marginTop: 4 },
  todoTitle: { fontSize: 11, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', marginBottom: 6 },
  todoItem: { fontSize: 12, color: Colors.text, lineHeight: 20 },

  markDoneBtn: {
    backgroundColor: '#22c55e', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 14,
  },
  markDoneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  completedBadge: {
    backgroundColor: '#22c55e18', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 14,
    borderWidth: 1, borderColor: '#22c55e44',
  },
  completedBadgeText: { color: '#22c55e', fontWeight: '700', fontSize: 14 },
});