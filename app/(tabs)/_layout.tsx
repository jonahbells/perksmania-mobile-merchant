import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { usePerksStore } from '../../store/perksStore';
import { useThemeStore } from '../../store/themeStore';
import QRScanner from '../../components/QRScanner';

function TabBarBadge({ count }: { count: number }) {
  const { colors } = useThemeStore();

  if (count === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: colors.error,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useThemeStore();
  const { orders } = usePerksStore();
  const [scannerVisible, setScannerVisible] = useState(false);

  // Count pending orders for badge
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 88,
          },
          tabBarLabelStyle: {
            fontSize: moderateScale(10),
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: -4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perks"
          options={{
            title: 'Perks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="gift" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scanner"
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation and open modal instead
              e.preventDefault();
              setScannerVisible(true);
            },
          }}
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="qr-code" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons name="receipt" size={size} color={color} />
                <TabBarBadge count={pendingOrdersCount} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* QR Scanner modal mounted at the tabs root for seamless UX */}
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={(order) => {
          // You can hook additional behavior here if needed
          console.log('Scanned order:', order);
          setScannerVisible(false);
        }}
      />
    </>
  );
}
