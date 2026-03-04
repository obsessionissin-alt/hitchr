// Type declarations for @expo/vector-icons
declare module '@expo/vector-icons' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';

  export interface IoniconsProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export class Ionicons extends Component<IoniconsProps> {
    static glyphMap: Record<string, number>;
  }
  
  export default Ionicons;
}



