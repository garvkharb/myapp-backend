import React, { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { sendChatMessage } from '../services/api';
import Colors from '../theme/colors';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant',
      text: 'Hi! I\'m your AI study tutor 🎓\nAsk me anything about your subjects — Math, Science, History, Literature, and more. I\'m here to help you learn!' },
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const flatRef = useRef();

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      const { reply } = await sendChatMessage(text);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', text: reply,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: '⚠️ Something went wrong. Please try again.',
      }]);
    } finally {
      setTyping(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>🤖 AI Study Tutor</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Study-only mode</Text></View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}>
                {item.role === 'assistant' && (
                  <Text style={styles.aiLabel}>StudyMate AI</Text>
                )}
                <Text style={[
                  styles.bubbleText,
                  item.role === 'user' ? styles.userText : styles.aiText,
                ]}>
                  {item.text}
                </Text>
              </View>
            )}
            ListFooterComponent={typing ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            ) : null}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about any subject..."
              placeholderTextColor={Colors.muted}
              multiline
              maxLength={500}
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || typing) && styles.sendDisabled]}
              onPress={send}
              disabled={!input.trim() || typing}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  topTitle: { fontSize: 16, fontWeight: '800', color: Colors.bright },
  badge: { backgroundColor: Colors.accent + '22', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '44' },
  badgeText: { fontSize: 10, color: Colors.accent, fontWeight: '700', letterSpacing: 0.5 },
  messagesList: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '85%', marginBottom: 12, borderRadius: 16, padding: 14 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  aiLabel: { fontSize: 10, color: Colors.accent, fontWeight: '700',
    letterSpacing: 0.5, marginBottom: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: Colors.white },
  aiText: { color: Colors.text },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingBottom: 8 },
  typingText: { color: Colors.muted, fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1,
    borderTopColor: Colors.border, gap: 10, alignItems: 'flex-end',
    backgroundColor: Colors.surface },
  input: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
    fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { backgroundColor: Colors.border },
  sendIcon: { color: Colors.white, fontSize: 20, fontWeight: '900' },
});
