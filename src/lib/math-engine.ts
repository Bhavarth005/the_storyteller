// ─── Types ───────────────────────────────────────────────────────────────────

export interface RawSegment {
  start_sec: number;
  end_sec: number;
  text: string;
  emotion: string;
  emotion_intensity: number; // 0.0 to 1.0
}

export interface SmoothedSegment extends RawSegment {
  smoothed_intensity: number;
  tension_score: number;
  drop_probability: number;
  engagement_score: number;
}

export interface TensionPoint {
  time_sec: number;
  tension: number;
}

export interface RadarMetrics {
  hook_strength: number;
  suspense_density: number;
  retention_stability: number;
  [key: string]: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SMA_WINDOW = 3;
const DEFAULT_THREAT_LEVEL = 0.5;
const TENSION_LOW_THRESHOLD = 0.35;  // slightly more sensitive
const CONSECUTIVE_DROP_COUNT = 1;    // flag single low-tension segments too
const HIGH_DROP_PROBABILITY = 0.72;
const NORMAL_DROP_PROBABILITY = 0.1;

// ─── SMA Smoothing ──────────────────────────────────────────────────────────

/**
 * Applies a 3-point Simple Moving Average to an array of numbers.
 * Edge values use available neighbors (partial window).
 */
function simpleMovingAverage(values: number[], window: number = SMA_WINDOW): number[] {
  if (values.length === 0) return [];
  return values.map((_, i) => {
    const halfWindow = Math.floor(window / 2);
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length - 1, i + halfWindow);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += values[j];
      count++;
    }
    return count > 0 ? sum / count : 0;
  });
}

// ─── Tension Curve ───────────────────────────────────────────────────────────

/**
 * Takes raw NLP segments, applies SMA smoothing, and computes a tension score
 * for each segment. Returns an array of {time_sec, tension} points optimized
 * for a Recharts line graph.
 *
 * Formula: tension = (smoothed_intensity * 0.7) + (threat_level * 0.3)
 */
export function calculateTensionCurve(
  segments: RawSegment[],
  threatLevel: number = DEFAULT_THREAT_LEVEL
): TensionPoint[] {
  if (segments.length === 0) return [];

  const rawIntensities = segments.map((s) => s.emotion_intensity);
  const smoothed = simpleMovingAverage(rawIntensities);

  return segments.map((seg, i) => {
    // PRD formula: Tension = (SMA_emotion * 0.5) + (threat_level * 0.3) + (information_gap * 0.2)
    // information_gap is approximated as the inverse of the segment's relative position
    // (later segments carry more unresolved information — it builds toward the end)
    const positionFactor = segments.length > 1 ? i / (segments.length - 1) : 0.5;
    const informationGap = 0.3 + positionFactor * 0.5; // grows from 0.3 to 0.8 across the episode
    return {
      time_sec: seg.start_sec,
      tension: parseFloat(
        (smoothed[i] * 0.5 + threatLevel * 0.3 + informationGap * 0.2).toFixed(4)
      ),
    };
  });
}

// ─── Retention Risk Detection ────────────────────────────────────────────────

/**
 * Enriches raw segments with smoothed intensity, tension scores, drop
 * probability, and engagement scores. Marks consecutive low-tension zones
 * (tension < 0.3 for 2+ segments / 20s) as high retention risk.
 */
export function detectRetentionRisks(
  segments: RawSegment[],
  threatLevel: number = DEFAULT_THREAT_LEVEL
): SmoothedSegment[] {
  if (segments.length === 0) return [];

  const rawIntensities = segments.map((s) => s.emotion_intensity);
  const smoothed = simpleMovingAverage(rawIntensities);

  // Build enriched segments with tension scores
  const enriched: SmoothedSegment[] = segments.map((seg, i) => {
    const smoothedIntensity = smoothed[i];
    const tensionScore = smoothedIntensity * 0.7 + threatLevel * 0.3;
    return {
      ...seg,
      smoothed_intensity: parseFloat(smoothedIntensity.toFixed(4)),
      tension_score: parseFloat(tensionScore.toFixed(4)),
      drop_probability: NORMAL_DROP_PROBABILITY,
      engagement_score: parseFloat(tensionScore.toFixed(4)), // baseline = tension
    };
  });

  // Scan for consecutive low-tension zones
  let consecutiveLowCount = 0;
  for (let i = 0; i < enriched.length; i++) {
    if (enriched[i].tension_score < TENSION_LOW_THRESHOLD) {
      consecutiveLowCount++;
    } else {
      consecutiveLowCount = 0;
    }

    if (consecutiveLowCount >= CONSECUTIVE_DROP_COUNT) {
      // Mark current and all preceding consecutive low segments
      for (let j = i; j > i - consecutiveLowCount; j--) {
        enriched[j].drop_probability = HIGH_DROP_PROBABILITY;
        enriched[j].engagement_score = parseFloat(
          Math.max(0, enriched[j].tension_score - 0.2).toFixed(4)
        );
      }
    }
  }

  return enriched;
}

// ─── Engagement Score ────────────────────────────────────────────────────────

/**
 * Derives a normalized [0, 1] engagement score from hook strength, emotional
 * variance, and cliffhanger power.
 *
 * Formula: (hook_strength * 0.35) + (emotional_variance * 0.35) + (cliffhanger_power * 0.30)
 */
export function deriveEngagementScore(
  hookStrength: number,
  emotionalVariance: number,
  cliffhangerPower: number
): number {
  const raw =
    (Number.isFinite(hookStrength) ? hookStrength : 0) * 0.35 +
    (Number.isFinite(emotionalVariance) ? emotionalVariance : 0) * 0.35 +
    (Number.isFinite(cliffhangerPower) ? cliffhangerPower : 0) * 0.3;
  return parseFloat(Math.min(1, Math.max(0, raw)).toFixed(4));
}

// ─── Emotional Variance Index ────────────────────────────────────────────────

/**
 * Standard deviation of emotion intensities — higher = more dynamic storytelling.
 */
export function calculateEmotionalVariance(intensities: number[]): number {
  if (intensities.length === 0) return 0;
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const squaredDiffs = intensities.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / intensities.length;
  return parseFloat(Math.sqrt(variance).toFixed(4));
}

// ─── Version Delta Comparison ────────────────────────────────────────────────

/**
 * Computes the delta between two RadarMetrics objects. Returns string-formatted
 * differences with + or - signs for the frontend "Before & After" UI.
 */
export function calculateVersionDelta(
  baseMetrics: RadarMetrics,
  targetMetrics: RadarMetrics
): Record<string, string> {
  const allKeys = new Set([
    ...Object.keys(baseMetrics),
    ...Object.keys(targetMetrics),
  ]);

  const deltas: Record<string, string> = {};

  for (const key of allKeys) {
    const baseVal = baseMetrics[key] ?? 0;
    const targetVal = targetMetrics[key] ?? 0;
    const diff = targetVal - baseVal;
    const formatted = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
    deltas[key] = formatted;
  }

  return deltas;
}

// ─── Flatline Zone Detection ─────────────────────────────────────────────────

export interface FlatlineZone {
  start_sec: number;
  end_sec: number;
  duration_sec: number;
}

/**
 * Returns time ranges where emotion_velocity is consistently low —
 * indicating viewer boredom zones. Used by the /explain endpoint.
 * Emotion velocity: V_t = |intensity_t - intensity_{t-1}|
 */
export function detectFlatlineZones(
  segments: RawSegment[],
  velocityThreshold = 0.08,
  minDurationSec = 10
): FlatlineZone[] {
  if (segments.length < 2) return [];

  const zones: FlatlineZone[] = [];
  let flatStart: number | null = null;

  for (let i = 1; i < segments.length; i++) {
    const velocity = Math.abs(segments[i].emotion_intensity - segments[i - 1].emotion_intensity);
    const isFlat = velocity < velocityThreshold && segments[i].emotion_intensity < 0.3;

    if (isFlat && flatStart === null) {
      flatStart = segments[i - 1].start_sec;
    } else if (!isFlat && flatStart !== null) {
      const duration = segments[i - 1].end_sec - flatStart;
      if (duration >= minDurationSec) {
        zones.push({ start_sec: flatStart, end_sec: segments[i - 1].end_sec, duration_sec: duration });
      }
      flatStart = null;
    }
  }

  if (flatStart !== null) {
    const last = segments[segments.length - 1];
    const duration = last.end_sec - flatStart;
    if (duration >= minDurationSec) {
      zones.push({ start_sec: flatStart, end_sec: last.end_sec, duration_sec: duration });
    }
  }

  return zones;
}
