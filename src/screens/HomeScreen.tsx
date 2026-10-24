import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PressableScale } from '../components/PressableScale';
import { aircraftRegistry } from '../data/aircraftRegistry';
import { AircraftConfig } from '../models/Aircraft';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout, list } from '../theme/spacing';
import { useDeviceType } from '../utils/useDeviceType';
import { hapticTap } from '../utils/haptics';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isTablet } = useDeviceType();

  const renderAircraft = ({ item }: { item: AircraftConfig }) => (
    <View style={[styles.card, isTablet && styles.cardGrid]}>
      <PressableScale
        onPress={() => {
          hapticTap();
          navigation.navigate('Calculator', { aircraft: item });
        }}
        style={styles.row}
      >
        <View style={styles.rowMain}>
          <Text style={styles.registration}>{item.registration}</Text>
          <Text style={styles.model}>{item.model}</Text>
          <Text style={styles.details}>
            Empty Weight: {item.emptyWeight} kg • Max TO: {item.maxTakeoffWeight} kg
          </Text>
        </View>
        <View style={styles.rowActions}>
          <PressableScale
            style={styles.actionButton}
            onPress={() => {
              hapticTap();
              navigation.navigate('Performance', { aircraft: item });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Performance for ${item.registration}`}
          >
            <Text style={styles.actionButtonText}>Perf</Text>
          </PressableScale>
          <PressableScale
            style={styles.infoButton}
            onPress={() => {
              hapticTap();
              navigation.navigate('Details', { aircraft: item });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Details for ${item.registration}`}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </PressableScale>
        </View>
      </PressableScale>
    </View>
  );

  return (
    <FlatList
      key={isTablet ? 'grid' : 'list'}
      style={styles.container}
      data={aircraftRegistry}
      keyExtractor={item => item.registration}
      renderItem={renderAircraft}
      numColumns={isTablet ? 2 : 1}
      columnWrapperStyle={isTablet ? styles.gridRow : undefined}
      ListHeaderComponent={<Text style={styles.sectionHeader}>Select Aircraft</Text>}
      contentContainerStyle={[styles.listContent, isTablet && styles.listContentTablet]}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  listContent: {
    paddingBottom: list.bottomPadding,
  },
  listContentTablet: {
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  gridRow: {
    paddingHorizontal: list.insetHorizontal,
    gap: list.cardGap,
  },
  cardGrid: {
    flex: 1,
    marginHorizontal: 0,
  },
  sectionHeader: {
    ...typography.footnote,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: list.insetHorizontal + list.cardGap,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: list.cardRadius,
    marginHorizontal: list.insetHorizontal,
    marginBottom: list.cardGap,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: list.xl,
  },
  rowMain: {
    flex: 1,
  },
  registration: {
    ...typography.title3,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  model: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 2,
  },
  details: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 6,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    height: 32,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.white,
  },
  infoButton: {
    marginLeft: 10,
    width: 32,
    height: 32,
    backgroundColor: colors.fill,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.primary,
    marginTop: -2,
  },
});
