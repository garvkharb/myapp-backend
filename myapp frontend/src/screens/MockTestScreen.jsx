import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types } from '@react-native-documents/picker';
import { generateTest as generateTestApi, submitTest as submitTestApi, getRecommendations } from '../services/api';
import Colors from '../theme/colors';

const DIFFICULTY_TIMERS = { easy: 15, medium: 20, hard: 30 };

export default function MockTestScreen() {
  const [subject, setSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [profileSubjects, setProfileSubjects] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQ, setNumQ] = useState('10');
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const [timerMinutes, setTimerMinutes] = useState('20');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  const [pdfTimerMinutes, setPdfTimerMinutes] = useState('60');
  const [uploadedTestName, setUploadedTestName] = useState(null);
  const [uploadedTestUri, setUploadedTestUri] = useState(null);
  const [pdfOpened, setPdfOpened] = useState(false);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);

  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchRecommendations();
    loadProfileSubjects();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (difficulty && numQ) {
      const suggested = Math.round((DIFFICULTY_TIMERS[difficulty] / 10) * Number(numQ));
      setTimerMinutes(String(suggested));
    }
  }, [difficulty, numQ]);

  const loadProfileSubjects = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.subjects && parsed.subjects.length > 0) {
          setProfileSubjects(parsed.subjects);
        }
      }
    } catch (e) {}
  };

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendations();
      setRecommendations(data.recommendations || []);
    } catch (e) {}
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // FIXED timer - uses ref so interval always has latest value
  const startTimer = (minutes) => {
    clearInterval(timerRef.current);
    const totalSeconds = Number(minutes) * 60;
    timeLeftRef.current = totalSeconds;
    setTimeLeft(totalSeconds);
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        setTimerRunning(false);
        Alert.alert('⏰ Time Up!', 'Your test time has ended!');
      }
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
  };

  const selectSubject = (subj) => {
    setSelectedSubject(subj);
    setSubject(subj);
    setDropdownVisible(false);
  };

  const generateTest = async () => {
    const subj = selectedSubject || subject;
    if (!subj) return Alert.alert('Enter a subject');
    setLoading(true);
    setTest(null);
    setResult(null);
    setAnswers({});
    stopTimer();
    try {
      const data = await generateTestApi({
        subject: subj,
        topic: topic || subj,
        difficulty,
        num_questions: Number(numQ),
      });
      setTest(data);
      setTimerModalVisible(true);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadTest = async () => {
    try {
      const res = await pick({ allowMultiSelection: false, type: [types.pdf] });
      const file = res[0];
      setUploadedTestName(file.name);
      setUploadedTestUri(file.uri);
      setPdfOpened(false);
      setTimerModalVisible(true);
    } catch (e) {
      if (e?.code !== 'DOCUMENT_PICKER_CANCELED') Alert.alert('Error', e.message);
    }
  };

  const handleStartPdfTest = () => {
    const mins = Number(pdfTimerMinutes) > 0 ? pdfTimerMinutes : '60';
    setTimerModalVisible(false);
    setPdfOpened(true);
    // Open PDF in external viewer
    if (uploadedTestUri) {
      Linking.canOpenURL(uploadedTestUri)
        .then(supported => {
          if (supported) {
            Linking.openURL(uploadedTestUri);
          } else {
            Alert.alert('PDF Opened', `Now do your test!\nFile: ${uploadedTestName}`);
          }
        })
        .catch(() => {
          Alert.alert('PDF Ready', `File: ${uploadedTestName}\nTimer is running!`);
        });
    }
    // Start timer after short delay so modal closes first
    setTimeout(() => startTimer(mins), 300);
  };

  const handleStartGeneratedTest = () => {
    const mins = Number(timerMinutes) > 0 ? timerMinutes : '20';
    setTimerModalVisible(false);
    setTimeout(() => startTimer(mins), 300);
  };

  const submitTest = async () => {
    if (Object.keys(answers).length < (test?.questions?.length || 0)) {
      return Alert.alert('Answer all questions first');
    }
    stopTimer();
    setLoading(true);
    try {
      const formattedAnswers = {};
      test.questions.forEach((q, i) => {
        formattedAnswers[q.id || String(i)] = String.fromCharCode(65 + answers[i]);
      });
      const res = await submitTestApi({ test_id: test.id, answers: formattedAnswers });
      setResult(res);
      fetchRecommendations();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>📝 Mock Test</Text>

          {recommendations.length > 0 && !test && !pdfOpened && (
            <View style={styles.knnCard}>
              <View style={styles.knnTitleRow}>
                <Text style={styles.knnIcon}>🧠</Text>
                <View>
                  <Text style={styles.knnTitle}>KNN Insight</Text>
                  <Text style={styles.knnSubtitle}>Weak areas from your past tests</Text>
                </View>
              </View>
              <View style={styles.knnDivider} />
              {recommendations.map((rec, i) => (
                <TouchableOpacity key={i} style={styles.knnRow}
                  onPress={() => { setSubject(rec); setSelectedSubject(rec); }}>
                  <View style={styles.knnRankBadge}>
                    <Text style={styles.knnRankText}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.knnSubject}>{rec}</Text>
                    <Text style={styles.knnHint}>Tap to auto-fill subject</Text>
                  </View>
                  <Text style={styles.knnArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!test && !pdfOpened && (
            <View style={styles.form}>
              <Text style={styles.label}>Subject</Text>
              {profileSubjects.length > 0 && (
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setDropdownVisible(true)}>
                  <Text style={styles.dropdownTriggerText}>
                    {selectedSubject || '📚 Select from your subjects ▾'}
                  </Text>
                </TouchableOpacity>
              )}
              {profileSubjects.length > 0 && !selectedSubject && (
                <Text style={styles.orText}>— or type manually —</Text>
              )}
              {!selectedSubject && (
                <TextInput style={styles.input} placeholder="e.g. Biology, Math..."
                  placeholderTextColor={Colors.muted} value={subject} onChangeText={setSubject} />
              )}
              {selectedSubject !== '' && (
                <TouchableOpacity onPress={() => { setSelectedSubject(''); setSubject(''); }}>
                  <Text style={styles.clearSubject}>✕ Clear selection</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Topic (optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Photosynthesis, Algebra..."
                placeholderTextColor={Colors.muted} value={topic} onChangeText={setTopic} />

              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.diffRow}>
                {difficulties.map(d => (
                  <TouchableOpacity key={d}
                    style={[styles.diffBtn, difficulty === d && styles.diffActive]}
                    onPress={() => setDifficulty(d)}>
                    <Text style={[styles.diffText, difficulty === d && { color: Colors.white }]}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Number of Questions</Text>
              <TextInput style={styles.input} value={numQ} onChangeText={setNumQ}
                keyboardType="numeric" placeholderTextColor={Colors.muted} />

              <View style={styles.timerPreview}>
                <Text style={styles.timerPreviewText}>⏱️ Suggested: {timerMinutes} min</Text>
                <TouchableOpacity onPress={() => setEditingTimer(!editingTimer)}>
                  <Text style={styles.timerEditBtn}>Edit</Text>
                </TouchableOpacity>
              </View>
              {editingTimer && (
                <TextInput style={styles.input} value={timerMinutes}
                  onChangeText={setTimerMinutes} keyboardType="numeric"
                  placeholder="Minutes" placeholderTextColor={Colors.muted} />
              )}

              <TouchableOpacity style={styles.genBtn} onPress={generateTest} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.genText}>🤖 Generate Test</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadBtn} onPress={uploadTest}>
                <Text style={styles.uploadText}>📄 Upload PDF Test</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PDF test timer bar */}
          {pdfOpened && !result && (
            <>
              <View style={styles.timerBar}>
                <Text style={styles.timerDisplay}>
                  {timerRunning ? `⏱️ ${formatTime(timeLeft)}` : timeLeft > 0 ? `⏱️ ${formatTime(timeLeft)} (paused)` : '⏱️ Timer stopped'}
                </Text>
                {!timerRunning ? (
                  <TouchableOpacity style={styles.startTimerBtn}
                    onPress={() => startTimer(pdfTimerMinutes)}>
                    <Text style={styles.startTimerText}>Start</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.startTimerBtn, { backgroundColor: '#ef4444' }]}
                    onPress={stopTimer}>
                    <Text style={styles.startTimerText}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.pdfCard}>
                <Text style={styles.pdfCardTitle}>📄 {uploadedTestName}</Text>
                <Text style={styles.pdfCardSub}>Your PDF test is open. Complete it and come back.</Text>
                <TouchableOpacity style={styles.reopenBtn}
                  onPress={() => uploadedTestUri && Linking.openURL(uploadedTestUri).catch(() => {})}>
                  <Text style={styles.reopenText}>📂 Reopen PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  stopTimer();
                  setUploadedTestName(null);
                  setUploadedTestUri(null);
                  setPdfOpened(false);
                }}>
                  <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                    ✕ Cancel Test
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Generated test timer bar */}
          {test && !result && (
            <>
              <View style={styles.timerBar}>
                <Text style={styles.timerDisplay}>
                  {timerRunning ? `⏱️ ${formatTime(timeLeft)}` : '⏱️ Timer not started'}
                </Text>
                {!timerRunning ? (
                  <TouchableOpacity style={styles.startTimerBtn}
                    onPress={() => startTimer(timerMinutes)}>
                    <Text style={styles.startTimerText}>Start</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.startTimerBtn, { backgroundColor: '#ef4444' }]}
                    onPress={stopTimer}>
                    <Text style={styles.startTimerText}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.testHeader}>
                <Text style={styles.testTitle}>{test.title || subject}</Text>
                <TouchableOpacity onPress={() => { setTest(null); setResult(null); stopTimer(); }}>
                  <Text style={{ color: Colors.muted, fontSize: 12 }}>New Test</Text>
                </TouchableOpacity>
              </View>

              {(test.questions || []).map((q, qi) => (
                <View key={qi} style={styles.qCard}>
                  <Text style={styles.qText}>{qi + 1}. {q.question}</Text>
                  {(q.options || []).map((opt, oi) => (
                    <TouchableOpacity key={oi}
                      style={[styles.optBtn, answers[qi] === oi && styles.optSelected]}
                      onPress={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}>
                      <Text style={[styles.optText, answers[qi] === oi && { color: Colors.accent }]}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              <TouchableOpacity style={styles.submitBtn} onPress={submitTest} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.submitText}>Submit Test</Text>}
              </TouchableOpacity>
            </>
          )}

          {result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>🎉 Test Results</Text>
              <Text style={styles.score}>{result.correct}/{result.total}</Text>
              <Text style={styles.scorePct}>{result.score}% Correct</Text>
              {result.fuzzy_grade && (
                <View style={styles.fuzzyBox}>
                  <Text style={styles.fuzzyGrade}>{result.fuzzy_grade}</Text>
                  <Text style={styles.fuzzyAdvice}>{result.fuzzy_advice}</Text>
                </View>
              )}
              {result.fuzzy_memberships && (
                <View style={styles.membershipBox}>
                  <Text style={styles.membershipTitle}>🧠 Fuzzy Analysis</Text>
                  {Object.entries(result.fuzzy_memberships).map(([key, val]) => (
                    <View key={key} style={styles.membershipRow}>
                      <Text style={styles.membershipLabel}>
                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <View style={styles.membershipTrack}>
                        <View style={[styles.membershipFill, { width: `${val * 100}%` }]} />
                      </View>
                      <Text style={styles.membershipVal}>{Math.round(val * 100)}%</Text>
                    </View>
                  ))}
                </View>
              )}
              {result.score < 70 ? (
                <View style={styles.weakBox}>
                  <Text style={styles.weakText}>📊 KNN: Added to recommendations!</Text>
                  <Text style={styles.weakSubText}>This subject needs more practice.</Text>
                </View>
              ) : (
                <View style={styles.strongBox}>
                  <Text style={styles.strongText}>✅ Great performance! Keep it up!</Text>
                </View>
              )}
              <TouchableOpacity style={styles.retryBtn}
                onPress={() => { setTest(null); setResult(null); setPdfOpened(false); }}>
                <Text style={styles.retryText}>Take Another Test</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Subject Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
          onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📚 Select Subject</Text>
            <FlatList
              data={profileSubjects}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, selectedSubject === item && styles.dropdownItemActive]}
                  onPress={() => selectSubject(item)}>
                  <Text style={[styles.dropdownItemText, selectedSubject === item && styles.dropdownItemTextActive]}>
                    {item}
                  </Text>
                  {selectedSubject === item && <Text style={styles.dropdownCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Timer Setup Modal */}
      <Modal visible={timerModalVisible} transparent animationType="fade"
        onRequestClose={() => setTimerModalVisible(false)}>
        <View style={styles.timerModalOverlay}>
          <View style={styles.timerModalBox}>
            <Text style={styles.timerModalTitle}>⏱️ Set Timer</Text>
            <Text style={styles.timerModalSubtitle}>
              {uploadedTestName
                ? `PDF: ${uploadedTestName}`
                : `Suggested ${timerMinutes} min for ${difficulty} difficulty`}
            </Text>
            <TextInput
              style={styles.timerModalInput}
              value={uploadedTestName ? pdfTimerMinutes : timerMinutes}
              onChangeText={uploadedTestName ? setPdfTimerMinutes : setTimerMinutes}
              keyboardType="numeric"
              placeholder="Minutes"
              placeholderTextColor={Colors.muted}
            />
            <TouchableOpacity
              style={styles.timerModalStart}
              onPress={uploadedTestName ? handleStartPdfTest : handleStartGeneratedTest}>
              <Text style={styles.timerModalStartText}>▶ Start Test & Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setTimerModalVisible(false);
              if (uploadedTestName) setPdfOpened(true);
            }}>
              <Text style={styles.timerModalSkip}>Skip Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.bright, marginBottom: 20 },
  knnCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.accent + '33' },
  knnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  knnIcon: { fontSize: 28 },
  knnTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  knnSubtitle: { fontSize: 11, color: Colors.muted },
  knnDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  knnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '44' },
  knnRankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent + '22', justifyContent: 'center', alignItems: 'center' },
  knnRankText: { fontSize: 11, fontWeight: '800', color: Colors.accent },
  knnSubject: { fontSize: 14, fontWeight: '700', color: Colors.text },
  knnHint: { fontSize: 10, color: Colors.muted },
  knnArrow: { fontSize: 16, color: Colors.accent },
  form: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, gap: 12, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 13, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  dropdownTrigger: { backgroundColor: Colors.surface, borderRadius: 10, padding: 13, borderWidth: 1, borderColor: Colors.accent + '66' },
  dropdownTriggerText: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  orText: { textAlign: 'center', color: Colors.muted, fontSize: 11 },
  clearSubject: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  diffActive: { backgroundColor: Colors.accent },
  diffText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
  timerPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  timerPreviewText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  timerEditBtn: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  genBtn: { backgroundColor: Colors.accent, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  genText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  uploadBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  uploadText: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  timerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  timerDisplay: { fontSize: 20, fontWeight: '800', color: Colors.bright },
  startTimerBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  startTimerText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  pdfCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginBottom: 20 },
  pdfCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.bright, marginBottom: 8, textAlign: 'center' },
  pdfCardSub: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginBottom: 16 },
  reopenBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  reopenText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  testTitle: { fontSize: 16, fontWeight: '700', color: Colors.bright },
  qCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  qText: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  optBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  optSelected: { borderColor: Colors.accent },
  optText: { fontSize: 13, color: Colors.text },
  submitBtn: { backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  resultBox: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  resultTitle: { fontSize: 18, fontWeight: '800', color: Colors.bright, marginBottom: 12 },
  score: { fontSize: 52, fontWeight: '900', color: Colors.accent },
  scorePct: { fontSize: 16, color: Colors.muted, marginBottom: 16 },
  fuzzyBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, width: '100%' },
  fuzzyGrade: { fontSize: 20, fontWeight: '800', color: Colors.bright, marginBottom: 6 },
  fuzzyAdvice: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  membershipBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, width: '100%', borderWidth: 1, borderColor: Colors.border },
  membershipTitle: { fontSize: 13, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', marginBottom: 12 },
  membershipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  membershipLabel: { width: 80, fontSize: 11, color: Colors.text },
  membershipTrack: { flex: 1, height: 6, backgroundColor: Colors.card, borderRadius: 6 },
  membershipFill: { height: 6, backgroundColor: Colors.accent, borderRadius: 6 },
  membershipVal: { width: 30, fontSize: 11, color: Colors.muted, textAlign: 'right' },
  weakBox: { backgroundColor: '#ff000011', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ff000033', marginBottom: 16, alignItems: 'center' },
  weakText: { color: '#ff6b6b', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  weakSubText: { color: Colors.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  strongBox: { backgroundColor: '#00ff0011', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#00ff0033', marginBottom: 16 },
  strongText: { color: Colors.green, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.accent, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  retryText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.bright, marginBottom: 16 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  dropdownItemActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent + '66' },
  dropdownItemText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  dropdownItemTextActive: { color: Colors.accent },
  dropdownCheck: { fontSize: 16, color: Colors.accent, fontWeight: '800' },
  timerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  timerModalBox: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: Colors.border },
  timerModalTitle: { fontSize: 22, fontWeight: '800', color: Colors.bright, marginBottom: 6, textAlign: 'center' },
  timerModalSubtitle: { fontSize: 13, color: Colors.muted, marginBottom: 20, textAlign: 'center' },
  timerModalInput: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  timerModalStart: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  timerModalStartText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  timerModalSkip: { color: Colors.muted, textAlign: 'center', fontSize: 13, fontWeight: '600' },
});