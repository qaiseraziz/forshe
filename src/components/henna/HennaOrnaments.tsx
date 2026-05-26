import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Circle, G, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { hennaColors } from '../../constants/hennaTokens';

/**
 * Henna & Pearl — ornaments.
 *
 * RN porting notes:
 *  - `MeshOverlay` (the web prototype layered two radial-gradient ellipses).
 *    RN has no radial-gradient primitive on a View, so it's implemented as
 *    a pre-rendered <Svg> with two RadialGradient defs. Cheaper than
 *    rasterising a PNG and still works in dark/light.
 *  - `PaperNoise` (the CSS dot-pattern grain) is intentionally OMITTED.
 *    RN can't render `background-image: radial-gradient(dots)` and shipping
 *    a tiled PNG is overkill for the warmth it added — the page gradient
 *    alone reads as warm pearl. Re-introduce as an asset only if needed.
 */

// ── ArabesqueCorner ─────────────────────────────────────────────────
interface ArabesqueCornerProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

function ArabesqueCornerImpl({
  size = 90,
  color = hennaColors.henna,
  opacity = 0.18,
  style,
}: ArabesqueCornerProps) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
          <Path d="M 95 5 Q 70 25 50 50 Q 30 75 5 95" />
          <Path d="M 95 5 Q 88 22 70 30 Q 78 40 92 30" />
          <Path d="M 50 50 Q 35 38 28 50 Q 38 60 50 50" />
          <Path d="M 50 50 Q 65 62 72 50 Q 62 40 50 50" />
          <Path d="M 25 75 Q 18 68 12 75 Q 18 82 25 75" />
          <Circle cx="50" cy="50" r="1.2" fill={color} stroke="none" />
          <Circle cx="76" cy="32" r="0.8" fill={color} stroke="none" />
          <Circle cx="22" cy="78" r="0.8" fill={color} stroke="none" />
        </G>
      </Svg>
    </View>
  );
}

export const ArabesqueCorner = React.memo(ArabesqueCornerImpl);

// ── Trefoil (inline glyph) ──────────────────────────────────────────
interface TrefoilProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

function TrefoilImpl({ size = 14, color = hennaColors.henna, style }: TrefoilProps) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M 12 4 Q 10 9 12 12 Q 14 9 12 4" />
          <Path d="M 4 12 Q 9 10 12 12 Q 9 14 4 12" />
          <Path d="M 20 12 Q 15 10 12 12 Q 15 14 20 12" />
          <Circle cx="12" cy="12" r="1" fill={color} stroke="none" />
        </G>
      </Svg>
    </View>
  );
}

export const Trefoil = React.memo(TrefoilImpl);

// ── DividerOrnament ─────────────────────────────────────────────────
interface DividerOrnamentProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function DividerOrnamentImpl({
  color = hennaColors.henna,
  size = 22,
  style,
}: DividerOrnamentProps) {
  return (
    <View style={[styles.dividerRow, style]}>
      <View style={[styles.dividerLine, { backgroundColor: hennaColors.line }]} />
      <Svg width={size * 3} height={size} viewBox="0 0 66 22">
        <G fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M 33 6 L 38 11 L 33 16 L 28 11 Z" />
          <Circle cx="33" cy="11" r="1" fill={color} stroke="none" />
          <Path d="M 26 11 Q 20 6 14 11 Q 20 13 26 11" />
          <Path d="M 40 11 Q 46 6 52 11 Q 46 13 40 11" />
          <Circle cx="10" cy="11" r="1" fill={color} stroke="none" />
          <Circle cx="56" cy="11" r="1" fill={color} stroke="none" />
        </G>
      </Svg>
      <View style={[styles.dividerLine, { backgroundColor: hennaColors.line }]} />
    </View>
  );
}

export const DividerOrnament = React.memo(DividerOrnamentImpl);

// ── Drop (illuminated badge w/ Trefoil) ─────────────────────────────
interface DropProps {
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}

function DropImpl({
  size = 28,
  color = hennaColors.henna,
  bg = hennaColors.hennaBg,
  style,
}: DropProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          // inset 1px hairline approximated via accent at 20% alpha
          borderColor: withAlpha(color, 0.2),
        },
        style,
      ]}
    >
      <Trefoil size={Math.round(size * 0.55)} color={color} />
    </View>
  );
}

export const Drop = React.memo(DropImpl);

// ── MarginMark ──────────────────────────────────────────────────────
interface MarginMarkProps {
  color?: string;
  style?: StyleProp<ViewStyle>;
}

function MarginMarkImpl({ color = hennaColors.henna, style }: MarginMarkProps) {
  return (
    <View style={style}>
      <Svg width={10} height={20} viewBox="0 0 10 20">
        <G fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round">
          <Path d="M 5 2 L 5 18" />
          <Circle cx="5" cy="6" r="1.4" fill={color} />
          <Circle cx="5" cy="14" r="1.4" fill={color} />
        </G>
      </Svg>
    </View>
  );
}

export const MarginMark = React.memo(MarginMarkImpl);

// ── MeshOverlay ─────────────────────────────────────────────────────
interface MeshOverlayProps {
  style?: StyleProp<ViewStyle>;
}

function MeshOverlayImpl({ style }: MeshOverlayProps) {
  // SVG with two RadialGradient defs — closest RN port of the web prototype's
  // `radial-gradient(...)` background. Absolutely positioned, non-interactive.
  return (
    <Svg
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <Defs>
        <RadialGradient id="meshA" cx="20%" cy="30%" rx="70%" ry="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.45} />
          <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="meshB" cx="80%" cy="80%" rx="60%" ry="40%">
          <Stop offset="0%" stopColor="#934939" stopOpacity={0.1} />
          <Stop offset="60%" stopColor="#934939" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="20%" cy="30%" rx="70%" ry="50%" fill="url(#meshA)" />
      <Ellipse cx="80%" cy="80%" rx="60%" ry="40%" fill="url(#meshB)" />
    </Svg>
  );
}

export const MeshOverlay = React.memo(MeshOverlayImpl);

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
});
