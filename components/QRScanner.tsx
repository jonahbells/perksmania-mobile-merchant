import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useThemeStore } from '../store/themeStore';
import { usePerksStore } from '../store/perksStore';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';


interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (order: any) => void;
}

export default function QRScanner({ visible, onClose, onScanSuccess }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { colors } = useThemeStore();
  const { verifyRedemption } = usePerksStore();

  const handleRequestPermission = useCallback(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  useEffect(() => {
    handleRequestPermission();
  }, [handleRequestPermission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      const order = await verifyRedemption(data);
      
      if (order) {
        Alert.alert(
          'Redemption Successful!',
          `Customer: ${order.customerName}\nPerk: ${order.perkTitle}\nCode: ${order.redemptionCode}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onScanSuccess?.(order);
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not valid or has already been used.',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
              }
            },
            {
              text: 'Close',
              onPress: onClose
            }
          ]
        );
      }
    } catch {
      Alert.alert(
        'Scan Error',
        'Unable to process this QR code. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            }
          },
          {
            text: 'Close',
            onPress: onClose
          }
        ]
      );
    }

    setIsProcessing(false);
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="camera-outline" size={64} color={colors.text} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionMessage, { color: colors.textSecondary }]}>
            We need camera access to scan QR codes for perk redemptions.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.background }]}>
              Grant Camera Access
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Scan QR Code
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Scanner Frame */}
            <View style={styles.scannerContainer}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
              </View>
            </View>

            {/* Instructions */}
            <View style={[styles.instructions, { backgroundColor: colors.background }]}>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                {isProcessing
                  ? 'Processing QR code...'
                  : 'Position the QR code within the frame to scan'}
              </Text>
              {scanned && !isProcessing && (
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: colors.primary }]}
                  onPress={resetScanner}
                >
                  <Text style={[styles.resetButtonText, { color: colors.background }]}>
                    Scan Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(16),
  },
  closeButton: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: scale(250),
    height: scale(250),
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: scale(30),
    height: scale(30),
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  instructionText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  resetButton: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
  },
  resetButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  permissionTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  permissionMessage: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(30),
  },
  permissionButton: {
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(16),
  },
  permissionButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
  },
});
