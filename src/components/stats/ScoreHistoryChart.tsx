import { Fragment, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import {
  buildScoreHistory,
  getScoreHistoryTimeDomain,
  sampleEvenIndices,
  type ScoreHistoryTimeframe,
} from "../../lib/scoreHistory";
import type { GameWithFrames } from "../../types";
import { scoreHistoryChartColors } from "./scoreHistoryChartColors";
import { TimeframeSelect } from "./TimeframeSelect";

interface ScoreHistoryChartProps {
  games: GameWithFrames[];
  timeframe: ScoreHistoryTimeframe;
  onTimeframeChange: (timeframe: ScoreHistoryTimeframe) => void;
}

const MIN_CHART_WIDTH = 220;
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 12, bottom: 24, left: 34 };
const INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
const GUIDE_LINE_STEP = 50;
const MAX_INTERACTIVE_POINTS = 10;
const HIT_TARGET_SIZE = 24;
const TOOLTIP_WIDTH = 100;
const TOOLTIP_HEIGHT = 42;

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Guide-line values from 0 up to the next multiple of 50 above the highest score on the chart. */
function guideValues(maxScore: number): [number[], number] {
  const yMax = Math.max(GUIDE_LINE_STEP, Math.ceil(maxScore / GUIDE_LINE_STEP) * GUIDE_LINE_STEP);
  const values: number[] = [];
  for (let value = 0; value <= yMax; value += GUIDE_LINE_STEP) values.push(value);
  return [values, yMax];
}

export function ScoreHistoryChart({ games, timeframe, onTimeframeChange }: ScoreHistoryChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  const chartWidth = Math.max(MIN_CHART_WIDTH, windowWidth - 64);
  const innerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;

  const points = useMemo(() => buildScoreHistory(games, timeframe), [games, timeframe]);
  const interactiveIndices = useMemo(
    () => new Set(sampleEvenIndices(points.length, MAX_INTERACTIVE_POINTS)),
    [points.length]
  );

  const maxScore = points.length ? Math.max(...points.map((point) => point.score)) : 0;
  const [guides, yMax] = guideValues(maxScore);

  // lastMonth/lastYear plot points at their true position within a fixed calendar
  // span (so a gap in play reads as a gap on the axis); count-based timeframes have
  // no natural span, so they fall back to spacing points evenly by index.
  const timeDomain = getScoreHistoryTimeDomain(timeframe);

  const xFor = (index: number) => {
    if (timeDomain) {
      const domainStart = timeDomain.start.getTime();
      const domainEnd = timeDomain.end.getTime();
      const pointTime = new Date(points[index].date).getTime();
      const ratio = domainEnd === domainStart ? 0 : (pointTime - domainStart) / (domainEnd - domainStart);
      return CHART_PADDING.left + Math.min(Math.max(ratio, 0), 1) * innerWidth;
    }
    return CHART_PADDING.left + (points.length <= 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  };
  const yFor = (score: number) => CHART_PADDING.top + INNER_HEIGHT - (score / yMax) * INNER_HEIGHT;

  const handleTimeframeChange = (next: ScoreHistoryTimeframe) => {
    onTimeframeChange(next);
    setHoveredIndex(null);
    setPinnedIndex(null);
  };

  const activeIndex = hoveredIndex ?? pinnedIndex;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  let tooltipLeft = 0;
  let tooltipTop = 0;
  if (activePoint && activeIndex !== null) {
    const pointX = xFor(activeIndex);
    const pointY = yFor(activePoint.score);
    tooltipLeft = Math.min(Math.max(pointX - TOOLTIP_WIDTH / 2, 0), chartWidth - TOOLTIP_WIDTH);
    tooltipTop = Math.max(pointY - TOOLTIP_HEIGHT - 10, 0);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Score History</Text>
        <TimeframeSelect value={timeframe} onChange={handleTimeframeChange} />
      </View>

      {points.length === 0 ? (
        <View style={[styles.emptyState, { width: chartWidth, height: CHART_HEIGHT }]}>
          <Text style={styles.emptyText}>No games in this timeframe.</Text>
        </View>
      ) : (
        <View style={{ width: chartWidth, height: CHART_HEIGHT }}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {guides.map((value) => (
              <Fragment key={value}>
                <Line
                  x1={CHART_PADDING.left}
                  y1={yFor(value)}
                  x2={chartWidth - CHART_PADDING.right}
                  y2={yFor(value)}
                  stroke={scoreHistoryChartColors.gridLine}
                  strokeWidth={1}
                />
                <SvgText
                  x={CHART_PADDING.left - 8}
                  y={yFor(value) + 3}
                  fontSize={9}
                  fill={scoreHistoryChartColors.gridLabel}
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </Fragment>
            ))}

            {points.length > 1 && (
              <Polyline
                points={points.map((point, index) => `${xFor(index)},${yFor(point.score)}`).join(" ")}
                fill="none"
                stroke={scoreHistoryChartColors.line}
                strokeWidth={2}
              />
            )}

            {points.map((point, index) => {
              const isInteractive = interactiveIndices.has(index);
              return (
                <Circle
                  key={point.gameId}
                  cx={xFor(index)}
                  cy={yFor(point.score)}
                  r={isInteractive ? 5 : 2.5}
                  fill={isInteractive ? scoreHistoryChartColors.pointFill : scoreHistoryChartColors.minorPoint}
                  stroke={isInteractive ? scoreHistoryChartColors.point : "none"}
                  strokeWidth={isInteractive ? 2 : 0}
                />
              );
            })}
          </Svg>

          {points.map((point, index) => {
            if (!interactiveIndices.has(index)) return null;
            const left = xFor(index) - HIT_TARGET_SIZE / 2;
            const top = yFor(point.score) - HIT_TARGET_SIZE / 2;
            return (
              <Pressable
                key={point.gameId}
                style={[styles.hitTarget, { left, top }]}
                onHoverIn={() => setHoveredIndex(index)}
                onHoverOut={() => setHoveredIndex((current) => (current === index ? null : current))}
                onPress={() => setPinnedIndex((current) => (current === index ? null : index))}
              />
            );
          })}

          {activePoint && (
            <View pointerEvents="none" style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop }]}>
              <Text style={styles.tooltipScore}>{activePoint.score}</Text>
              <Text style={styles.tooltipDate}>{formatDate(activePoint.date)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: scoreHistoryChartColors.background,
    borderColor: scoreHistoryChartColors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: scoreHistoryChartColors.title,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: scoreHistoryChartColors.empty,
    fontSize: 13,
  },
  hitTarget: {
    position: "absolute",
    width: HIT_TARGET_SIZE,
    height: HIT_TARGET_SIZE,
  },
  tooltip: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: scoreHistoryChartColors.tooltipBackground,
    alignItems: "center",
  },
  tooltipScore: {
    fontSize: 14,
    fontWeight: "700",
    color: scoreHistoryChartColors.tooltipText,
  },
  tooltipDate: {
    fontSize: 10,
    color: scoreHistoryChartColors.tooltipText,
  },
});
