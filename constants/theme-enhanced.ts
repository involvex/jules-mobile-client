import { Appearance, ColorSchemeName } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Enhanced theme system with dark mode support
export interface ThemeColors {
  // Base colors
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;

  // GitHub specific colors
  githubPrimary: string;
  githubSecondary: string;
  githubBackground: string;
  githubBorder: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interactive colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;

  // Surface colors
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  card: string;
  cardHover: string;

  // Border colors
  border: string;
  borderHover: string;
  borderFocus: string;

  // Shadow colors
  shadow: string;

  // GitHub workflow colors
  workflowRunning: string;
  workflowSuccess: string;
  workflowFailed: string;
  workflowCancelled: string;
  workflowPending: string;

  // GitHub status colors
  statusActive: string;
  statusDisabled: string;
  statusCompleted: string;

  // Notification colors
  notificationSuccess: string;
  notificationWarning: string;
  notificationError: string;
  notificationInfo: string;
}

export interface ThemeTypography {
  // Font sizes
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  "4xl": number;

  // Font weights
  light: string;
  medium: string;
  semibold: string;
  bold: string;

  // Line heights
  tight: number;
  snug: number;
  relaxed: number;
  loose: number;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  "4xl": number;
}

export interface ThemeShadows {
  sm: any;
  md: any;
  lg: any;
  xl: any;
  "2xl": any;
}

export interface ThemeRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
  full: number;
}

export interface ThemeBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  radius: ThemeRadius;
  breakpoints: ThemeBreakpoints;
}

// Light theme colors
const lightColors: ThemeColors = {
  // Base colors
  background: "#ffffff",
  backgroundSecondary: "#f8fafc",
  text: "#1e293b",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",

  // GitHub specific colors
  githubPrimary: "#0969da",
  githubSecondary: "#6e7681",
  githubBackground: "#ffffff",
  githubBorder: "#d0d7de",

  // Status colors
  success: "#1f883d",
  warning: "#9a6700",
  error: "#da3633",
  info: "#0969da",

  // Interactive colors
  primary: "#0969da",
  primaryHover: "#0860ca",
  primaryActive: "#0969da",
  secondary: "#6e7681",
  secondaryHover: "#8b949e",
  secondaryActive: "#6e7681",

  // Surface colors
  surface: "#ffffff",
  surfaceHover: "#f6f8fa",
  surfaceActive: "#eef1f4",
  card: "#ffffff",
  cardHover: "#f6f8fa",

  // Border colors
  border: "#d0d7de",
  borderHover: "#8b949e",
  borderFocus: "#0969da",

  // Shadow colors
  shadow: "rgba(0, 0, 0, 0.1)",

  // GitHub workflow colors
  workflowRunning: "#0969da",
  workflowSuccess: "#1f883d",
  workflowFailed: "#da3633",
  workflowCancelled: "#8b949e",
  workflowPending: "#d29922",

  // GitHub status colors
  statusActive: "#1f883d",
  statusDisabled: "#8b949e",
  statusCompleted: "#1f883d",

  // Notification colors
  notificationSuccess: "#d1fae5",
  notificationWarning: "#fef3c7",
  notificationError: "#fee2e2",
  notificationInfo: "#dbeafe",
};

// Dark theme colors
const darkColors: ThemeColors = {
  // Base colors
  background: "#0d1117",
  backgroundSecondary: "#161b22",
  text: "#c9d1d9",
  textSecondary: "#8b949e",
  textTertiary: "#6e7681",

  // GitHub specific colors
  githubPrimary: "#58a6ff",
  githubSecondary: "#8b949e",
  githubBackground: "#0d1117",
  githubBorder: "#30363d",

  // Status colors
  success: "#3fb950",
  warning: "#d29922",
  error: "#f85149",
  info: "#58a6ff",

  // Interactive colors
  primary: "#58a6ff",
  primaryHover: "#79c0ff",
  primaryActive: "#58a6ff",
  secondary: "#8b949e",
  secondaryHover: "#b1bac4",
  secondaryActive: "#8b949e",

  // Surface colors
  surface: "#161b22",
  surfaceHover: "#21262d",
  surfaceActive: "#30363d",
  card: "#161b22",
  cardHover: "#21262d",

  // Border colors
  border: "#30363d",
  borderHover: "#8b949e",
  borderFocus: "#58a6ff",

  // Shadow colors
  shadow: "rgba(0, 0, 0, 0.3)",

  // GitHub workflow colors
  workflowRunning: "#58a6ff",
  workflowSuccess: "#3fb950",
  workflowFailed: "#f85149",
  workflowCancelled: "#8b949e",
  workflowPending: "#d29922",

  // GitHub status colors
  statusActive: "#3fb950",
  statusDisabled: "#8b949e",
  statusCompleted: "#3fb950",

  // Notification colors
  notificationSuccess: "#1f6feb",
  notificationWarning: "#9e6a03",
  notificationError: "#da3633",
  notificationInfo: "#0969da",
};

// Typography scale
const typography: ThemeTypography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,

  light: "300",
  medium: "500",
  semibold: "600",
  bold: "700",

  tight: 1.2,
  snug: 1.3,
  relaxed: 1.6,
  loose: 1.8,
};

// Spacing scale
const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

// Shadow definitions
const shadows: ThemeShadows = {
  sm: {
    boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  md: {
    boxShadow: "0px 2px 4px 0px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  lg: {
    boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.1)",
    elevation: 8,
  },
  xl: {
    boxShadow: "0px 8px 16px 0px rgba(0, 0, 0, 0.1)",
    elevation: 16,
  },
  "2xl": {
    boxShadow: "0px 16px 32px 0px rgba(0, 0, 0, 0.1)",
    elevation: 32,
  },
};

// Border radius scale
const radius: ThemeRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

// Breakpoints for responsive design
const breakpoints: ThemeBreakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// Create theme configurations
export const lightTheme: ThemeConfig = {
  colors: lightColors,
  typography,
  spacing,
  shadows,
  radius,
  breakpoints,
};

export const darkTheme: ThemeConfig = {
  colors: darkColors,
  typography,
  spacing,
  shadows,
  radius,
  breakpoints,
};

// Theme hook with enhanced functionality
export function useTheme(): {
  theme: ThemeConfig;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  radius: ThemeRadius;
  isDark: boolean;
  colorScheme: ColorSchemeName;
} {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    shadows: theme.shadows,
    radius: theme.radius,
    isDark,
    colorScheme,
  };
}

// Theme-aware color function
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors,
): string {
  const { colors, isDark } = useTheme();

  const color = props[isDark ? "dark" : "light"] || colors[colorName];
  return color;
}

// Color manipulation utilities
export const colorUtils = {
  // Lighten a color by a percentage
  lighten: (color: string, percent: number): string => {
    // Implementation for lightening colors
    (color as any).lighten(percent / 100);
    return color;
  },

  // Darken a color by a percentage
  darken: (color: string, percent: number): string => {
    // Implementation for darkening colors
    (color as any).darken(percent / 100);
    return color;
  },

  // Get contrast color (black or white)
  getContrast: (color: string): string => {
    // Implementation for getting contrast color
    return (color as any).isLight() ? "#ffffff" : "#000000";
    // return "#000000";
  },

  // Opacity for colors
  withOpacity: (color: string, opacity: number): string => {
    // Implementation for adding opacity
    (color as any).alpha(opacity);
    return color;
  },
};

// Animation presets
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    tension: 200,
    friction: 20,
  },
  bouncy: {
    tension: 10,
    friction: 5,
  },
};

// Responsive utilities
export const responsive = {
  up: (breakpoint: keyof ThemeBreakpoints) => {
    return `@media (min-width: ${lightTheme.breakpoints[breakpoint]}px)`;
  },

  down: (breakpoint: keyof ThemeBreakpoints) => {
    const nextBreakpoint = Object.keys(lightTheme.breakpoints).find(
      key =>
        lightTheme.breakpoints[key as keyof ThemeBreakpoints] >
        lightTheme.breakpoints[breakpoint],
    );

    if (!nextBreakpoint)
      return `@media (max-width: ${lightTheme.breakpoints[breakpoint]}px)`;

    return `@media (max-width: ${lightTheme.breakpoints[nextBreakpoint as keyof ThemeBreakpoints] - 1}px)`;
  },

  between: (min: keyof ThemeBreakpoints, max: keyof ThemeBreakpoints) => {
    return `@media (min-width: ${lightTheme.breakpoints[min]}px) and (max-width: ${lightTheme.breakpoints[max] - 1}px)`;
  },
};

// Accessibility utilities
export const accessibility = {
  // High contrast mode detection
  isHighContrast: (): boolean => {
    return Appearance.getColorScheme() === "dark";
  },

  // Reduced motion detection
  prefersReducedMotion: (): boolean => {
    // This would need platform-specific implementation
    return false;
  },

  // Font scaling
  getFontSize: (size: keyof ThemeTypography): string | number => {
    const { typography } = useTheme();
    return typography[size];
  },
};

// Export default theme
export default lightTheme;
