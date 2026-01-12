import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useRef, useEffect } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UseTheme } from "@/constants/theme-enhanced";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

const LOCAL_MODELS = [
  {
    id: "gemma-2b",
    name: "Gemma 2B",
    size: "1.6GB",
    description: "Lightweight & Fast",
  },
  {
    id: "phi-3",
    name: "Phi-3 Mini",
    size: "2.3GB",
    description: "Powerful Reasoning",
  },
  {
    id: "tiny-llama",
    name: "TinyLlama",
    size: "600MB",
    description: "Ultra Lightweight",
  },
];

export default function LocalChatScreen() {
  // Call UseTheme first and ONLY once here to get everything needed
  const theme = UseTheme();
  const isDark = theme.isDark;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(LOCAL_MODELS[0]);

  // Derive all colors from the theme object we already have
  const backgroundColor = theme.colors.background;
  const borderColor = theme.colors.border; 
  const tintColor = theme.colors.primary;
  const secondaryBackground = isDark ? "#1e293b" : "#f1f5f9";

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsProcessing(true);

    // Simulate local AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `[Local ${selectedModel.name}] This is a simulated response. Local LLM execution would happen here using WebGPU or Native bindings.`,
        sender: "ai",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsProcessing(false);
    }, 1500);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View>
            <ThemedText type="subtitle">Local AI Chat</ThemedText>
            <TouchableOpacity
              style={styles.modelSelector}
              onPress={() => setIsModelModalVisible(true)}
            >
              <ThemedText style={styles.modelName}>
                {selectedModel.name}
              </ThemedText>
              <IconSymbol
                name="chevron.down"
                size={14}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setMessages([])}
          >
            <IconSymbol
              name="trash.fill"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="cpu" size={64} color={theme.colors.border} />
                <ThemedText style={styles.emptyText}>
                  Chat with local models on your device.
                </ThemedText>
                <ThemedText style={styles.emptySubText}>
                  No data leaves your device.
                </ThemedText>
              </View>
            ) : (
              messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.sender === "user"
                      ? [styles.userBubble, { backgroundColor: tintColor }]
                      : [
                          styles.aiBubble,
                          { backgroundColor: secondaryBackground },
                        ],
                  ]}
                >
                  <ThemedText
                    style={msg.sender === "user" ? styles.userText : null}
                  >
                    {msg.text}
                  </ThemedText>
                </View>
              ))
            )}
            {isProcessing && (
              <View
                style={[
                  styles.messageBubble,
                  styles.aiBubble,
                  { backgroundColor: secondaryBackground },
                ]}
              >
                <ActivityIndicator size="small" color={tintColor} />
              </View>
            )}
          </ScrollView>

          <View
            style={[styles.inputContainer, { borderTopColor: borderColor }]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: secondaryBackground,
                  borderColor: borderColor,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? tintColor
                    : theme.colors.border,
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="arrow.up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal
          visible={isModelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModelModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsModelModalVisible(false)}
          >
            <ThemedView
              style={[styles.modalContent, { borderColor: borderColor }]}
            >
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                Select Local Model
              </ThemedText>
              {LOCAL_MODELS.map(model => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelItem,
                    selectedModel.id === model.id && {
                      backgroundColor: tintColor + "20",
                    },
                  ]}
                  onPress={() => {
                    setSelectedModel(model);
                    setIsModelModalVisible(false);
                  }}
                >
                  <View>
                    <ThemedText type="defaultSemiBold">
                      {model.name}
                    </ThemedText>
                    <ThemedText style={styles.modelItemDesc}>
                      {model.description}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.modelItemSize}>
                    {model.size}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  modelSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  modelName: {
    fontSize: 12,
    opacity: 0.7,
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "#fff",
  },
  inputContainer: {
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modelItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modelItemDesc: {
    fontSize: 12,
    opacity: 0.6,
  },
  modelItemSize: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
});
