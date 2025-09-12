import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import QRScanner from '../../components/QRScanner';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useFocusEffect } from '@react-navigation/native';

export default function ScannerScreen() {
  const { colors } = useThemeStore();
  const [visible, setVisible] = useState(false);

  // Auto-open scanner when this tab/screen is focused; close when unfocused
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => setVisible(false);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>QR Scanner</Text>
        <TouchableOpacity 
          onPress={() => setVisible(true)} 
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="qr-code" size={20} color={colors.onPrimary} />
          <Text style={[styles.scanButtonText, { color: colors.onPrimary }]}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Ionicons name="scan" size={64} color={colors.textSecondary} />
        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          Tap &quot;Scan QR&quot; to start scanning a customer&apos;s redemption code.
        </Text>
      </View>

      <QRScanner 
        visible={visible} 
        onClose={() => setVisible(false)} 
        onScanSuccess={(order) => {
          console.log('Scanned order:', order);
          // Handle successful scan
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: scale(16) 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
  },
  title: { 
    fontSize: moderateScale(24), 
    fontWeight: 'bold' 
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    gap: scale(8),
  },
  scanButtonText: { 
    fontSize: moderateScale(14), 
    fontWeight: '600' 
  },
  body: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: verticalScale(100) 
  },
  helper: { 
    marginTop: verticalScale(16), 
    fontSize: moderateScale(16), 
    textAlign: 'center',
    paddingHorizontal: scale(32),
    lineHeight: moderateScale(24),
  },
});
