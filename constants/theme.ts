/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const brandBrown = "#936a4a"; // Softer, modern brown
const brandCream = "#FDFBF7"; // Very soft, modern cream background

export const Colors = {
  light: {
    text: "#292524",
    background: "#FDFBF7",
    tint: "#936a4a",
    icon: "#A8A29E",
    tabIconDefault: "#A8A29E",
    tabIconSelected: "#936a4a",
    card: "#FFFFFF",
    border: "#E7E5E4",
    button: "#936a4a",
    buttonText: "#FFFFFF",
    secondaryText: "#78716C",
  },
  dark: {
    text: "#E7E5E4",
    background: "#1C1917", // Very deep brown almost black (soothing on eyes)
    tint: "#D4A373", // Softer gold/brand color for dark mode
    icon: "#78716C",
    tabIconDefault: "#78716C",
    tabIconSelected: "#D4A373",
    card: "#292524", // Soft elevated card color (Not pure black, NOT white)
    border: "#44403C",
    button: "#D4A373",
    buttonText: "#1C1917",
    secondaryText: "#A8A29E",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
