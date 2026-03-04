// Type declarations for @react-navigation packages
declare module '@react-navigation/native' {
  import { ComponentType } from 'react';
  import { NavigationContainerRef } from '@react-navigation/native';

  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export function useFocusEffect(effect: () => void | (() => void)): void;
  
  export const NavigationContainer: ComponentType<any>;
  
  export type RouteProp<ParamList, RouteName extends keyof ParamList> = {
    params: ParamList[RouteName];
  };
}

declare module '@react-navigation/native-stack' {
  import { ComponentType } from 'react';

  export function createNativeStackNavigator<ParamList = any>(): {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
  };
  
  export type NativeStackNavigationProp<ParamList, RouteName extends keyof ParamList = keyof ParamList> = any;
}

declare module '@react-navigation/bottom-tabs' {
  import { ComponentType } from 'react';

  export function createBottomTabNavigator<ParamList = any>(): {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
  };
}



