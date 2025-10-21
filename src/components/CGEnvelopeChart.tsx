import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { AircraftConfig } from '../models/Aircraft';
import { inchesToMeters } from '../utils/units';

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

  // Chart dimensions
  const chartWidth = 350;
  const chartHeight = 240;
  const paddingLeft = 45; // More space for weight labels
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

  // Add padding above and below the envelope limits
  const envelopeMinWeight = Math.min(...weights);
  const envelopeMaxWeight = Math.max(...weights);
  const weightRange = envelopeMaxWeight - envelopeMinWeight;
  const weightPadding = Math.max(weightRange * 0.1, 20); // 10% padding or 20kg minimum

  const minWeight = envelopeMinWeight - weightPadding;
  const maxWeight = envelopeMaxWeight + weightPadding;
  const minCG = Math.min(...cgValues) - 0.05; // 5cm padding
  const maxCG = Math.max(...cgValues) + 0.05;

  // Scale functions
  const scaleX = (cg: number) => {
    return paddingLeft + ((cg - minCG) / (maxCG - minCG)) * plotWidth;
  };

  const scaleY = (weight: number) => {
    return chartHeight - paddingBottom - ((weight - minWeight) / (maxWeight - minWeight)) * plotHeight;
  };

  // Create envelope polygon points (convert CG to meters)
  const envelopePoints: string[] = [];

  // Top edge (forward to aft at max weight)
  for (let i = 0; i < aircraft.envelope.length; i++) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(inchesToMeters(point.cgMax))},${scaleY(point.weight)}`);
  }

  // Bottom edge (aft to forward at min weight)
  for (let i = aircraft.envelope.length - 1; i >= 0; i--) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(inchesToMeters(point.cgMin))},${scaleY(point.weight)}`);
  }

  const envelopePolygon = envelopePoints.join(' ');

  // Current position (convert CG to meters)
  const currentX = scaleX(inchesToMeters(currentCG));
  const currentY = scaleY(currentWeight);

  // Landing position (convert CG to meters)
  const landingX = landingCG ? scaleX(inchesToMeters(landingCG)) : null;
  const landingY = landingWeight ? scaleY(landingWeight) : null;

  // Grid lines (4 horizontal, 4 vertical)
  const gridLines: JSX.Element[] = [];
  const numGridLines = 4;

  // Vertical grid lines (CG)
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
        stroke="#E0E0E0"
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`v-label-${i}`}
        x={x}
        y={chartHeight - paddingBottom + 18}
        fill="#666"
        fontSize="10"
        textAnchor="middle"
      >
        {cg.toFixed(2)}
      </SvgText>
    );
  }

  // Horizontal grid lines (Weight)
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
        stroke="#E0E0E0"
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`h-label-${i}`}
        x={paddingLeft - 5}
        y={y + 4}
        fill="#666"
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
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>CG Envelope</Text>
        <Text style={styles.collapseIcon}>{isCollapsed ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {!isCollapsed && (
        <>
          <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {gridLines}

        {/* Envelope polygon */}
        <Polygon
          points={envelopePolygon}
          fill="#E8F5E9"
          stroke="#4CAF50"
          strokeWidth="2"
        />

        {/* Max Landing Weight line */}
        {aircraft.maxLandingWeight && aircraft.maxLandingWeight < aircraft.maxTakeoffWeight && (
          <>
            <Line
              x1={paddingLeft}
              y1={scaleY(aircraft.maxLandingWeight)}
              x2={chartWidth - paddingRight}
              y2={scaleY(aircraft.maxLandingWeight)}
              stroke="#FF9500"
              strokeWidth="2"
              strokeDasharray="8,4"
            />
            <SvgText
              x={paddingLeft + 5}
              y={scaleY(aircraft.maxLandingWeight) - 5}
              fill="#FF9500"
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
            {/* Cross lines to help see position */}
            <Line
              x1={currentX}
              y1={paddingTop}
              x2={currentX}
              y2={chartHeight - paddingBottom}
              stroke={isWithinEnvelope ? '#2196F3' : '#FF3B30'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <Line
              x1={paddingLeft}
              y1={currentY}
              x2={chartWidth - paddingRight}
              y2={currentY}
              stroke={isWithinEnvelope ? '#2196F3' : '#FF3B30'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Takeoff position dot */}
            <Circle
              cx={currentX}
              cy={currentY}
              r="6"
              fill={isWithinEnvelope ? '#2196F3' : '#FF3B30'}
              stroke="#FFF"
              strokeWidth="2"
            />
          </>
        )}

        {/* Landing position marker */}
        {landingX !== null && landingY !== null && landingWeight !== undefined && (
          <>
            {/* Cross lines for landing position */}
            <Line
              x1={landingX}
              y1={paddingTop}
              x2={landingX}
              y2={chartHeight - paddingBottom}
              stroke={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? '#34C759'
                  : '#FF9500'
              }
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <Line
              x1={paddingLeft}
              y1={landingY}
              x2={chartWidth - paddingRight}
              y2={landingY}
              stroke={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? '#34C759'
                  : '#FF9500'
              }
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* Landing position dot */}
            <Circle
              cx={landingX}
              cy={landingY}
              r="6"
              fill={
                landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                  ? '#34C759'
                  : '#FF9500'
              }
              stroke="#FFF"
              strokeWidth="2"
            />
          </>
        )}

        {/* Axis labels */}
        <SvgText
          x={chartWidth / 2}
          y={chartHeight - 5}
          fill="#333"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          CG Position (m)
        </SvgText>
        <SvgText
          x={8}
          y={chartHeight / 2}
          fill="#333"
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
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Safe Envelope</Text>
            </View>
            {aircraft.maxLandingWeight && aircraft.maxLandingWeight < aircraft.maxTakeoffWeight && (
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.legendText}>Max Landing</Text>
              </View>
            )}
            {currentWeight > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isWithinEnvelope ? '#2196F3' : '#FF3B30' }]} />
                <Text style={styles.legendText}>Takeoff</Text>
              </View>
            )}
            {landingX !== null && landingY !== null && landingWeight !== undefined && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {
                  backgroundColor: landingIsWithinEnvelope && landingWeight <= (aircraft.maxLandingWeight || aircraft.maxTakeoffWeight)
                    ? '#34C759'
                    : '#FF9500'
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
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  collapseIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
