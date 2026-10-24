import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, CalculatorScreen } from './src/screens';
import { AircraftDetailsScreen } from './src/screens/AircraftDetailsScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { AircraftConfig } from './src/models/Aircraft';
import { RootStackParamList } from './src/navigation/types';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.systemGroupedBackground,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerTintColor: colors.primary,
            headerBackTitle: 'Back',
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: true,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerLargeTitle: true,
              headerLargeTitleShadowVisible: false,
              title: 'Mass & Balance',
            }}
          />
          <Stack.Screen
            name="Calculator"
            component={CalculatorScreen}
            options={({ route }: { route: { params: RootStackParamList['Calculator'] } }) => ({
              title: route.params.aircraft.registration,
            })}
          />
          <Stack.Screen
            name="Details"
            component={AircraftDetailsScreen}
            options={({ route }: { route: { params: RootStackParamList['Details'] } }) => ({
              title: route.params.aircraft.registration,
            })}
          />
          <Stack.Screen
            name="Performance"
            component={PerformanceScreen}
            options={({ route }: { route: { params: RootStackParamList['Performance'] } }) => ({
              title: route.params.aircraft.registration,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}
