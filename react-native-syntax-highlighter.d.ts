declare module "react-native-syntax-highlighter" {
  import { ComponentType } from "react";

  export interface SyntaxHighlighterProps {
    value: string;
    language?: string;
    style?: any;
    customStyle?: any;
    codeTagProps?: any;
    [key: string]: any;
  }

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}
