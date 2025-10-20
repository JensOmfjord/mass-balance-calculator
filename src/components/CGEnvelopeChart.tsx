import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { AircraftConfig } from '../models/Aircraft';

interface CGEnvelopeChartProps {
  aircraft: AircraftConfig;
  currentWeight: number;
  currentCG: number;
  isWithinEnvelope: boolean;
}

export const CGEnvelopeChart: React.FC<CGEnvelopeChartProps> = ({
  aircraft,
  currentWeight,
  currentCG,
  isWithinEnvelope,
}) => {
  // Chart dimensions
  const chartWidth = 320;
  const chartHeight = 240;
  const padding = 40;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  // Find min/max values for scaling
  const weights = aircraft.envelope.map(point => point.weight);
  const cgValues = aircraft.envelope.flatMap(point => [point.cgMin, point.cgMax]);

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights, aircraft.maxTakeoffWeight);
  const minCG = Math.min(...cgValues) - 2;
  const maxCG = Math.max(...cgValues) + 2;

  // Scale functions
  const scaleX = (cg: number) => {
    return padding + ((cg - minCG) / (maxCG - minCG)) * plotWidth;
  };

  const scaleY = (weight: number) => {
    return chartHeight - padding - ((weight - minWeight) / (maxWeight - minWeight)) * plotHeight;
  };

  // Create envelope polygon points
  const envelopePoints: string[] = [];

  // Top edge (forward to aft at max weight)
  for (let i = 0; i < aircraft.envelope.length; i++) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(point.cgMax)},${scaleY(point.weight)}`);
  }

  // Bottom edge (aft to forward at min weight)
  for (let i = aircraft.envelope.length - 1; i >= 0; i--) {
    const point = aircraft.envelope[i];
    envelopePoints.push(`${scaleX(point.cgMin)},${scaleY(point.weight)}`);
  }

  const envelopePolygon = envelopePoints.join(' ');

  // Current position
  const currentX = scaleX(currentCG);
  const currentY = scaleY(currentWeight);

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
        y1={padding}
        x2={x}
        y2={chartHeight - padding}
        stroke="#E0E0E0"
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`v-label-${i}`}
        x={x}
        y={chartHeight - padding + 15}
        fill="#666"
        fontSize="10"
        textAnchor="middle"
      >
        {cg.toFixed(1)}
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
        x1={padding}
        y1={y}
        x2={chartWidth - padding}
        y2={y}
        stroke="#E0E0E0"
        strokeWidth="1"
      />
    );
    gridLines.push(
      <SvgText
        key={`h-label-${i}`}
        x={padding - 10}
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
      <Text style={styles.title}>CG Envelope</Text>
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

        {/* Current position marker */}
        {currentWeight > 0 && (
          <>
            {/* Cross lines to help see position */}
            <Line
              x1={currentX}
              y1={padding}
              x2={currentX}
              y2={chartHeight - padding}
              stroke={isWithinEnvelope ? '#2196F3' : '#FF3B30'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <Line
              x1={padding}
              y1={currentY}
              x2={chartWidth - padding}
              y2={currentY}
              stroke={isWithinEnvelope ? '#2196F3' : '#FF3B30'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* Current position dot */}
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

        {/* Axis labels */}
        <SvgText
          x={chartWidth / 2}
          y={chartHeight - 5}
          fill="#333"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
        >
          CG Position (inches)
        </SvgText>
        <SvgText
          x={15}
          y={chartHeight / 2}
          fill="#333"
          fontSize="12"
          fontWeight="600"
          textAnchor="middle"
          transform={`rotate(-90, 15, ${chartHeight / 2})`}
        >
          Weight (kg)
        </SvgText>
      </Svg>

      {currentWeight > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Safe Envelope</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isWithinEnvelope ? '#2196F3' : '#FF3B30' }]} />
            <Text style={styles.legendText}>Current Position</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 15,
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
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
