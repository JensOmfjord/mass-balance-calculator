import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Svg, { Line, Polygon, Circle, Text as SvgText, Defs, RadialGradient, Stop, Rect, ClipPath } from 'react-native-svg';
import { AircraftConfig } from '../models/Aircraft';
import { inchesToMeters } from '../utils/units';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

// Enable layout animations on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CGEnvelopeChartProps {
  aircraft: AircraftConfig;
  currentWeight: number;
  currentCG: number;
  isWithinEnvelope: boolean;
  landingWeight?: number;
  landingCG?: number;
  landingIsWithinEnvelope?: boolean;
}

export const CGEnvelopeChart: React.FC<CGEnvelopeChartProps> = ({
  aircraft,
  currentWeight,
  currentCG,
  isWithinEnvelope,
  landingWeight,
  landingCG,
  landingIsWithinEnvelope,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setIsCollapsed(!isCollapsed);
  };

  // Chart dimensions
  const chartWidth = 350;
  const chartHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Find min/max values for scaling (convert CG to meters)
  const weights = aircraft.envelope.map(point => point.weight);
  const cgValues = aircraft.envelope.flatMap(point => [
    inchesToMeters(point.cgMin),
    inchesToMeters(point.cgMax)
  ]);

  const envelopeMinWeight = Math.min(...weights);
  const envelopeMaxWeight = Math.max(...weights);
  const weightRange = envelopeMaxWeight - envelopeMinWeight;
  const weightPadding = Math.max(weightRange * 0.1, 20);

  const minWeight = envelopeMinWeight - weightPadding;
  const maxWeight = envelopeMaxWeight + weightPadding;
  const minCG = Math.min(...cgValues) - 0.05;
  const maxCG = Math.max(...cgValues) + 0.05;

  // Scale functions
  const scaleX = (cg: number) => {
    return paddingLeft + ((cg - minCG) / (maxCG - minCG)) * plotWidth;
  };

  const scaleY = (weight: number) => {
    return chartHeight - paddingBottom - ((weight - minWeight) / (maxWeight - minWeight)) * plotHeight;
  };

  // Envelope polygon points
  const envelopePoints: string[] = [];

  for (let i = 0; i < aircraft.envelope.length; i++) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(inchesToMeters(point.cgMax))},${scaleY(point.weight)}`);
  }

  for (let i = aircraft.envelope.length - 1; i >= 0; i--) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(inchesToMeters(point.cgMin))},${scaleY(point.weight)}`);
  }

  const envelopePolygon = envelopePoints.join(' ');

  // Current position
  const currentX = scaleX(inchesToMeters(currentCG));
  const currentY = scaleY(currentWeight);

  // Landing position
  const landingX = landingCG ? scaleX(inchesToMeters(landingCG)) : null;
  const landingY = landingWeight ? scaleY(landingWeight) : null;

  // Grid lines (4 horizontal, 4 vertical)
  const gridLines: React.ReactElement[] = [];
  const numGridLines = 4;

  for (let i = 0; i <= numGridLines; i++) {
    const cg = minCG + (i / numGridLines) * (maxCG - minCG);
    const x = scaleX(cg);
    gridLines.push(
      <Line
        key={`v-${i}`}
        x1={x}
        y1={paddingTop}
        x2={x}
        y2={chartHeight - paddingBottom}
        stroke={colors.separator}
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`v-label-${i}`}
        x={x}
        y={chartHeight - paddingBottom + 18}
        fill={colors.textSecondary}
        fontSize="10"
        textAnchor="middle"
      >
        {cg.toFixed(2)}
      </SvgText>
    );
  }

  for (let i = 0; i <= numGridLines; i++) {
    const weight = minWeight + (i / numGridLines) * (maxWeight - minWeight);
    const y = scaleY(weight);
    gridLines.push(
      <Line
        key={`h-${i}`}
        x1={paddingLeft}
        y1={y}
        x2={chartWidth - paddingRight}
        y2={y}
        stroke={colors.separator}
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`h-label-${i}`}
        x={paddingLeft - 5}
        y={y + 4}
        fill={colors.textSecondary}
        fontSize="10"
        textAnchor="end"
      >
        {Math.round(weight)}
      </SvgText>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleCollapse}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: !isCollapsed }}
      >
        <Text style={styles.title}>CG Envelope</Text>
        <Text style={styles.collapseIcon}>{isCollapsed ? 'Show' : 'Hide'}</Text>
      </TouchableOpacity>

      {!isCollapsed && (
        <>
          <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <RadialGradient id="takeoffGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={isWithinEnvelope ? colors.darkTeal : colors.error} stopOpacity="0.6" />
            <Stop offset="70%" stopColor={isWithinEnvelope ? colors.darkTeal : colors.error} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={isWithinEnvelope ? colors.darkTeal : colors.error} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="landingGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={
              landingIsWithinEnvelope && (landingWeight || 0) <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                ? colors.success
                : colors.warning
            } stopOpacity="0.6" />
            <Stop offset="70%" stopColor={
              landingIsWithinEnvelope && (landingWeight || 0) <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                ? colors.success
                : colors.warning
            } stopOpacity="0.2" />
            <Stop offset="100%" stopColor={
              landingIsWithinEnvelope && (landingWeight || 0) <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                ? colors.success
                : colors.warning
            } stopOpacity="0" />
          </RadialGradient>
          <ClipPath id="chartBounds">
            <Rect
              x={paddingLeft}
              y={paddingTop}
              width={plotWidth}
              height={plotHeight}
            />
          </ClipPath>
        </Defs>

        {gridLines}

        {/* Unsafe zone shading */}
        <Rect
          x={paddingLeft}
          y={paddingTop}
          width={plotWidth}
          height={plotHeight}
          fill="rgba(245, 166, 35, 0.08)"
          clipPath="url(#chartBounds)"
        />

        {/* Safe envelope */}
        <Polygon
          points={envelopePolygon}
          fill="rgba(75, 209, 160, 0.15)"
          stroke="none"
        />
        <Polygon
          points={envelopePolygon}
          fill="none"
          stroke={colors.success}
          strokeWidth="2.5"
        />

        {/* Max Landing Weight line */}
        {aircraft.maxLandingWeight && aircraft.maxLandingWeight < aircraft.maxTakeoffWeight && (
          <>
            <Line
              x1={paddingLeft}
              y1={scaleY(aircraft.maxLandingWeight)}
              x2={chartWidth - paddingRight}
              y2={scaleY(aircraft.maxLandingWeight)}
              stroke={colors.warning}
              strokeWidth="2"
              strokeDasharray="8,4"
            />
            <SvgText
              x={paddingLeft + 5}
              y={scaleY(aircraft.maxLandingWeight) - 5}
              fill={colors.warning}
              fontSize="10"
              fontWeight="600"
              textAnchor="start"
            >
              Max Landing: {aircraft.maxLandingWeight} kg
            </SvgText>
          </>
        )}

        {/* Takeoff position marker */}
        {currentWeight > 0 && (
          <>
            <Line
              x1={currentX}
              y1={paddingTop}
              x2={currentX}
              y2={chartHeight - paddingBottom}
              stroke={isWithinEnvelope ? colors.darkTeal : colors.error}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            <Line
              x1={paddingLeft}
              y1={currentY}
              x2={chartWidth - paddingRight}
              y2={currentY}
              stroke={isWithinEnvelope ? colors.darkTeal : colors.error}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />

            <Circle cx={currentX} cy={currentY} r="12" fill="url(#takeoffGlow)" />
            <Circle
              cx={currentX}
              cy={currentY}
              r="6"
              fill="none"
              stroke={isWithinEnvelope ? colors.darkTeal : colors.error}
              strokeWidth="1.5"
              opacity="0.5"
            />
            <Circle
              cx={currentX}
              cy={currentY}
              r="4"
              fill={isWithinEnvelope ? colors.darkTeal : colors.error}
              stroke="#FFF"
              strokeWidth="1.5"
            />
          </>
        )}

        {/* Landing position marker */}
        {landingX !== null && landingY !== null && landingWeight !== undefined && (
          <>
            <Line
              x1={landingX}
              y1={paddingTop}
              x2={landingX}
              y2={chartHeight - paddingBottom}
              stroke={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? colors.success
                  : colors.warning
              }
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            <Line
              x1={paddingLeft}
              y1={landingY}
              x2={chartWidth - paddingRight}
              y2={landingY}
              stroke={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? colors.success
                  : colors.warning
              }
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />

            <Circle cx={landingX} cy={landingY} r="12" fill="url(#landingGlow)" />
            <Circle
              cx={landingX}
              cy={landingY}
              r="6"
              fill="none"
              stroke={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? colors.success
                  : colors.warning
              }
              strokeWidth="1.5"
              opacity="0.5"
            />
            <Circle
              cx={landingX}
              cy={landingY}
              r="4"
              fill={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? colors.success
                  : colors.warning
              }
              stroke="#FFF"
              strokeWidth="1.5"
            />
          </>
        )}

        {/* Axis labels */}
        <SvgText
          x={chartWidth / 2}
          y={chartHeight - 5}
          fill={colors.textPrimary}
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          CG Position (m)
        </SvgText>
        <SvgText
          x={8}
          y={chartHeight / 2}
          fill={colors.textPrimary}
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          transform={`rotate(-90, 8, ${chartHeight / 2})`}
        >
          Weight (kg)
        </SvgText>
      </Svg>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Safe Envelope</Text>
            </View>
            {aircraft.maxLandingWeight && aircraft.maxLandingWeight < aircraft.maxTakeoffWeight && (
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: colors.warning }]} />
                <Text style={styles.legendText}>Max Landing</Text>
              </View>
            )}
            {currentWeight > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isWithinEnvelope ? colors.darkTeal : colors.error }]} />
                <Text style={styles.legendText}>Takeoff</Text>
              </View>
            )}
            {landingX !== null && landingY !== null && landingWeight !== undefined && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {
                  backgroundColor: landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                    ? colors.success
                    : colors.warning
                }]} />
                <Text style={styles.legendText}>Landing</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
    marginBottom: 2,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  collapseIcon: {
    ...typography.footnote,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
});
