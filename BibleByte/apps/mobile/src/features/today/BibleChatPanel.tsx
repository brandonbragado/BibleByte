import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { uiTheme } from "@biblebites/ui";
import { Button } from "../../components/ui";
import {
  isBibleChatConfigured,
  sendBibleChatMessage,
  type BibleChatMessage
} from "../../services/bibleChatService";

const PLACEHOLDER = "Ask me any questions you may have.";

const DISCLAIMER =
  "AI can summarize context and themes; it is not a substitute for pastors or counselors.";

export function BibleChatPanel() {
  const [messages, setMessages] = useState<BibleChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const configured = isBibleChatConfigured();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !configured) {
      return;
    }
    const nextMessages: BibleChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const reply = await sendBibleChatMessage(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const showThread = messages.length > 0 || loading || Boolean(error);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
      style={styles.keyboard}
    >
      <View style={styles.shell}>
        <Text style={styles.title}>Ask about the Bible</Text>

        <View style={styles.promptBlock}>
          <TextInput
            editable={configured && !loading}
            value={input}
            onChangeText={setInput}
            placeholder={configured ? PLACEHOLDER : "Configure API URL to chat"}
            placeholderTextColor={uiTheme.colors.sage}
            style={styles.promptInput}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Button
            label="Send"
            variant="secondary"
            size="sm"
            onPress={() => void handleSend()}
            loading={loading}
            disabled={!configured || !input.trim()}
          />
        </View>

        {!configured ? (
          <Text style={styles.offline}>
            To enable chat, set <Text style={styles.mono}>OPENAI_API_KEY</Text> on the API server and{" "}
            <Text style={styles.mono}>EXPO_PUBLIC_API_URL</Text> in the app env.
          </Text>
        ) : null}

        {showThread ? (
          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}
              >
                <Text style={styles.bubbleRole}>{message.role === "user" ? "You" : "Guide"}</Text>
                <Text style={styles.bubbleText}>{message.content}</Text>
              </View>
            ))}
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={uiTheme.colors.deepOlive} size="small" />
                <Text style={styles.loadingLabel}>Thinking…</Text>
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
        ) : null}

        <Text style={styles.microDisclaimer}>{DISCLAIMER}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: "100%"
  },
  shell: {
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.cream,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.sm,
    gap: uiTheme.spacing.xs,
    ...uiTheme.shadows.card
  },
  title: {
    color: uiTheme.colors.deepOlive,
    fontSize: uiTheme.typography.title,
    fontWeight: uiTheme.fontWeight.bold,
    marginBottom: uiTheme.spacing.xxs
  },
  promptBlock: {
    gap: uiTheme.spacing.xs
  },
  promptInput: {
    minHeight: 52,
    maxHeight: 100,
    borderRadius: uiTheme.radius.sm,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.parchment,
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: uiTheme.typography.lineHeight.tight
  },
  offline: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.caption,
    lineHeight: uiTheme.typography.lineHeight.tight,
    backgroundColor: uiTheme.colors.ivory,
    borderRadius: uiTheme.radius.sm,
    padding: uiTheme.spacing.xs
  },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: undefined }),
    fontSize: 11,
    color: uiTheme.colors.deepOlive
  },
  thread: {
    maxHeight: 160,
    marginTop: uiTheme.spacing.xxs
  },
  threadContent: {
    gap: uiTheme.spacing.xs,
    paddingBottom: uiTheme.spacing.xxs
  },
  bubble: {
    borderRadius: uiTheme.radius.sm,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.xs,
    gap: 2,
    borderWidth: 1
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: uiTheme.colors.parchment,
    borderColor: uiTheme.colors.border,
    maxWidth: "94%"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: uiTheme.colors.ivory,
    borderColor: uiTheme.colors.divider,
    maxWidth: "96%"
  },
  bubbleRole: {
    color: uiTheme.colors.sage,
    fontSize: 10,
    fontWeight: uiTheme.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  bubbleText: {
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.caption,
    lineHeight: 18
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs
  },
  loadingLabel: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.caption
  },
  errorText: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption
  },
  microDisclaimer: {
    color: uiTheme.colors.sage,
    fontSize: 10,
    lineHeight: 14,
    marginTop: uiTheme.spacing.xxs
  }
});
