import React, { useEffect } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { getSupabase } from '../lib/supabase';

// ── Auth Screens ──────────────────────────────────────────────
import { LoginScreen } from '../screens/auth/LoginScreen';

// ── Main Screens ──────────────────────────────────────────────
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { ScanScreen } from '../screens/main/ScanScreen';
import { HistoryScreen } from '../screens/main/HistoryScreen';
import { ReceiptDetailScreen } from '../screens/main/ReceiptDetailScreen';
import { ReceiptFormScreen } from '../screens/main/ReceiptFormScreen';

// ── Types ─────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  History: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ReceiptDetail: { receiptId: string };
  ReceiptForm: { imageUri: string; ocrData?: any };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ─── Tab Icon helper ──────────────────────────────────────────
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{icon}</Text>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────
function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 8,
          height: 56 + bottomPad,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.weights.semibold as any,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Tara',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? Colors.primary : Colors.surface,
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                borderWidth: 2,
                borderColor: focused ? Colors.primary : Colors.border,
                shadowColor: Colors.primary,
                shadowOpacity: focused ? 0.5 : 0,
                shadowRadius: 8,
                elevation: focused ? 6 : 0,
              }}
            >
              <Text style={{ fontSize: 22 }}>📷</Text>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: Typography.xs,
            fontWeight: Typography.weights.bold as any,
            color: Colors.primary,
          },
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Geçmiş',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack (Modal-style detail screens) ──────────────────
function MainStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="ReceiptForm"
        component={ReceiptFormScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Root Navigator (auth gate) ───────────────────────────────
export function AppNavigator() {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const client = getSupabase();

    // Restore session on app start
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Map Supabase user to app User type
        setUser({
          uid: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.display_name ?? session.user.email ?? '',
          role: session.user.user_metadata?.role ?? 'employee',
          department: session.user.user_metadata?.department,
          createdAt: new Date(session.user.created_at),
        });
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          email: session.user.email ?? '',
          displayName: session.user.user_metadata?.display_name ?? session.user.email ?? '',
          role: session.user.user_metadata?.role ?? 'employee',
          department: session.user.user_metadata?.department,
          createdAt: new Date(session.user.created_at),
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
