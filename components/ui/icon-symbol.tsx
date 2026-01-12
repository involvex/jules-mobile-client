// Fallback for using MaterialIcons on Android and web.

import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.down": "keyboard-arrow-down",
  "chevron.left": "chevron-left",
  "arrow.clockwise": "refresh",

  // Actions
  plus: "add",
  xmark: "close",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  circle: "radio-button-unchecked",

  // Content
  "message.fill": "chat",
  "bubble.left.and.bubble.right": "forum",
  "gearshape.fill": "settings",
  key: "vpn-key",
  terminal: "terminal",
  "doc.text": "description",
  wrench: "build",
  lightbulb: "lightbulb",
  "info.circle": "info",
  link: "link",
  magnifyingglass: "search",
  folder: "folder",
  "arrow.up": "arrow-upward",
  "arrow.triangle.merge": "call-merge",
  "exclamationmark.triangle": "warning",
  gearshape: "settings",
  questionmark: "help",
  "play.fill": "play-arrow",
  "safari.fill": "explore",
  "doc.on.doc": "content-copy",
  "doc.on.doc.fill": "content-copy",
  "lock.fill": "lock",
  "globe.fill": "public",
  "star.fill": "star",
  "fork.knife": "restaurant", // Best match for fork? Maybe 'call-split'? Let's use 'restaurant' for knife/fork icon if available or 'call-split' for git fork.
  "chevron.up": "keyboard-arrow-up",
  "pause.fill": "pause",
  cpu: "memory",
  "trash.fill": "delete",

  // Theme
  "sun.max.fill": "light-mode",
  "moon.fill": "dark-mode",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
