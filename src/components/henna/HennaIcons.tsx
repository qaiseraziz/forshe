import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { hennaColors } from '../../constants/hennaTokens';

/**
 * Henna & Pearl — hand-drawn icon library.
 * Ported from design-system/HennaIcons.web.jsx 1:1.
 * 24×24 viewBox · stroke 1.4 · rounded caps + joins · no fill (unless noted).
 */

export type HennaIconName =
  // group glyphs
  | 'money' | 'pot' | 'house' | 'heart' | 'mosque' | 'gear'
  // chrome
  | 'home' | 'menu' | 'search' | 'bell' | 'plus' | 'chev-right' | 'chev-down'
  | 'close' | 'check' | 'pencil' | 'trash' | 'share' | 'filter'
  | 'phone' | 'message' | 'star' | 'calendar' | 'clock' | 'sparkle' | 'moon' | 'sun'
  // content / quick-add
  | 'veg' | 'bread' | 'milk' | 'fruit' | 'pill' | 'fuel'
  | 'electricity' | 'water' | 'flame' | 'book' | 'cart' | 'utensils'
  // vendor categories
  | 'wrench' | 'bolt' | 'snow' | 'doctor' | 'tailor' | 'hammer'
  | 'leaf' | 'broom' | 'car' | 'list'
  // states / activity
  | 'goal' | 'chart' | 'report' | 'lock' | 'wallet' | 'box'
  | 'cycle' | 'body' | 'prayer';

interface Props {
  name: HennaIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function HennaIconImpl({ name, size = 24, color, strokeWidth = 1.4 }: Props) {
  const c = color ?? hennaColors.ink;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: c,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    // ── group glyphs ──────────────────────────────────────────────
    case 'money':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="7.5" />
          <Path d="M12 7 L13.2 10 L16.5 10.4 L14 12.8 L14.7 16 L12 14.4 L9.3 16 L10 12.8 L7.5 10.4 L10.8 10 Z" />
        </Svg>
      );
    case 'pot':
      return (
        <Svg {...common}>
          <Path d="M5 11 L19 11 L18 19 Q 18 20 17 20 L7 20 Q 6 20 6 19 Z" />
          <Path d="M3 11 L21 11" />
          <Path d="M9 8 Q 10 6 11 7 Q 12 6 13 7 Q 14 6 15 8" />
        </Svg>
      );
    case 'house':
      return (
        <Svg {...common}>
          <Path d="M4 11 L12 4 L20 11 V20 Q 20 21 19 21 L5 21 Q 4 21 4 20 Z" />
          <Path d="M10 21 L10 14 L14 14 L14 21" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path d="M12 20 C 4 14 4 7 8 6 Q 10 5.5 12 8 Q 14 5.5 16 6 C 20 7 20 14 12 20 Z" />
        </Svg>
      );
    case 'mosque':
      return (
        <Svg {...common}>
          <Path d="M5 20 L5 12 Q 5 11 6 11 L18 11 Q 19 11 19 12 L19 20" />
          <Path d="M12 11 Q 8 8 12 4 Q 16 8 12 11" />
          <Path d="M3 20 L21 20" />
          <Path d="M11 20 L11 16 Q 12 15 13 16 L13 20" />
          <Path d="M7 14 L7 16 M17 14 L17 16" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M12 4 L12 6 M12 18 L12 20 M4 12 L6 12 M18 12 L20 12 M6.5 6.5 L7.8 7.8 M16.2 16.2 L17.5 17.5 M6.5 17.5 L7.8 16.2 M16.2 7.8 L17.5 6.5" />
        </Svg>
      );

    // ── chrome ────────────────────────────────────────────────────
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3 11 L12 4 L21 11 V20 Q 21 21 20 21 L4 21 Q 3 21 3 20 Z" />
          <Path d="M10 21 V14 L14 14 V21" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...common}>
          <Path d="M4 7 L20 7 M4 12 L20 12 M4 17 L20 17" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="6.5" />
          <Path d="M16 16 L20 20" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path d="M6 18 Q 5.5 16 6 13 Q 6 8 8 7 Q 8.5 5 12 5 Q 15.5 5 16 7 Q 18 8 18 13 Q 18.5 16 18 18 Z" />
          <Path d="M10 18 L10 19 Q 10 21 12 21 Q 14 21 14 19 L14 18" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path d="M12 5 L12 19 M5 12 L19 12" />
        </Svg>
      );
    case 'chev-right':
      return (
        <Svg {...common}>
          <Path d="M9 6 L15 12 L9 18" />
        </Svg>
      );
    case 'chev-down':
      return (
        <Svg {...common}>
          <Path d="M6 9 L12 15 L18 9" />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path d="M6 6 L18 18 M18 6 L6 18" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 13 L10 18 L19 7" />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...common}>
          <Path d="M14 4 L20 10 L8 22 L2 22 L2 16 Z" />
          <Path d="M13 5 L19 11" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M5 7 L19 7 L18 21 Q 18 22 17 22 L7 22 Q 6 22 6 21 Z" />
          <Path d="M3 7 L21 7" />
          <Path d="M9 7 L9 4 L15 4 L15 7" />
          <Path d="M10 11 L10 18 M14 11 L14 18" />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...common}>
          <Circle cx="18" cy="5" r="2.5" />
          <Circle cx="6" cy="12" r="2.5" />
          <Circle cx="18" cy="19" r="2.5" />
          <Path d="M8 11 L16 6.5 M8 13 L16 17.5" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg {...common}>
          <Path d="M4 5 L20 5 L14 13 L14 20 L10 18 L10 13 Z" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...common}>
          <Path d="M5 4 L9 4 L11 9 L8 11 Q 10 15 13 17 L15 14 L20 16 L20 20 Q 20 21 19 21 Q 11 21 4 14 Q 3 6 3 5 Q 3 4 4 4 Z" />
        </Svg>
      );
    case 'message':
      return (
        <Svg {...common}>
          <Path d="M3 5 Q 3 4 4 4 L20 4 Q 21 4 21 5 L21 16 Q 21 17 20 17 L9 17 L4 21 L4 5 Z" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path d="M12 4 L14 10 L20 10.5 L15.5 14.5 L17 21 L12 17.5 L7 21 L8.5 14.5 L4 10.5 L10 10 Z" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Path d="M3 6 Q 3 5 4 5 L20 5 Q 21 5 21 6 L21 20 Q 21 21 20 21 L4 21 Q 3 21 3 20 Z" />
          <Path d="M3 10 L21 10" />
          <Path d="M7 3 L7 7 M17 3 L17 7" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8" />
          <Path d="M12 7 L12 12 L16 14" />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...common}>
          <Path d="M12 4 L13 10 L19 11 L13 12 L12 18 L11 12 L5 11 L11 10 Z" />
          <Path d="M19 4 L20 6 L22 7 L20 8 L19 10 L18 8 L16 7 L18 6 Z" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...common}>
          <Path d="M16 4 Q 9 4 9 12 Q 9 20 16 20 Q 12 18 12 12 Q 12 6 16 4 Z" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="4" />
          <Path d="M12 3 L12 5 M12 19 L12 21 M3 12 L5 12 M19 12 L21 12 M5.5 5.5 L7 7 M17 17 L18.5 18.5 M5.5 18.5 L7 17 M17 7 L18.5 5.5" />
        </Svg>
      );

    // ── content / quick-add ───────────────────────────────────────
    case 'veg':
      return (
        <Svg {...common}>
          <Path d="M5 13 Q 4 7 10 5 Q 12 4 14 5 Q 20 7 19 13 Q 18 21 12 21 Q 6 21 5 13 Z" />
          <Path d="M9 9 L9 13 M12 11 L12 15 M15 9 L15 13" />
        </Svg>
      );
    case 'bread':
      return (
        <Svg {...common}>
          <Path d="M4 10 Q 4 6 8 6 Q 10 4 12 6 Q 14 4 16 6 Q 20 6 20 10 Q 20 13 17 13 L17 19 Q 17 20 16 20 L8 20 Q 7 20 7 19 L7 13 Q 4 13 4 10 Z" />
          <Path d="M9 14 L15 14 M9 17 L15 17" />
        </Svg>
      );
    case 'milk':
      return (
        <Svg {...common}>
          <Path d="M8 3 L16 3 L16 6 L17 8 L17 20 Q 17 21 16 21 L8 21 Q 7 21 7 20 L7 8 L8 6 Z" />
          <Path d="M7 11 L17 11" />
        </Svg>
      );
    case 'fruit':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="14" r="6" />
          <Path d="M12 8 Q 12 5 15 4 M12 8 Q 12 6 10 5" />
        </Svg>
      );
    case 'pill':
      return (
        <Svg {...common}>
          <Path d="M6 12 Q 6 6 12 6 Q 18 6 18 12 Q 18 18 12 18 Q 6 18 6 12 Z" />
          <Path d="M12 6 L12 18" />
        </Svg>
      );
    case 'fuel':
      return (
        <Svg {...common}>
          <Path d="M5 4 Q 4 4 4 5 L4 19 Q 4 20 5 20 L13 20 Q 14 20 14 19 L14 5 Q 14 4 13 4 Z" />
          <Path d="M7 4 L7 11 L11 11 L11 4" />
          <Path d="M14 9 L17 9 L17 17 Q 17 18 18 18 Q 19 18 19 17 L19 7 L17 5" />
        </Svg>
      );
    case 'electricity':
      return (
        <Svg {...common}>
          <Path d="M13 3 L4 14 L11 14 L9 21 L20 9 L13 9 Z" />
        </Svg>
      );
    case 'water':
      return (
        <Svg {...common}>
          <Path d="M12 3 Q 6 11 6 15 Q 6 20 12 20 Q 18 20 18 15 Q 18 11 12 3 Z" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...common}>
          <Path d="M12 21 Q 6 21 6 15 Q 6 11 9 9 Q 8 6 10 4 Q 11 7 12 7 Q 14 5 14 3 Q 18 7 18 13 Q 18 21 12 21 Z" />
        </Svg>
      );
    case 'book':
      return (
        <Svg {...common}>
          <Path d="M4 5 Q 4 4 5 4 L11 4 Q 12 4 12 5 L12 20 Q 12 21 11 21 L5 21 Q 4 21 4 20 Z" />
          <Path d="M12 5 Q 12 4 13 4 L19 4 Q 20 4 20 5 L20 20 Q 20 21 19 21 L13 21 Q 12 21 12 20 Z" />
        </Svg>
      );
    case 'cart':
      return (
        <Svg {...common}>
          <Path d="M3 5 L5 5 L7 17 L19 17 L21 9 L7 9" />
          <Circle cx="9" cy="20" r="1" />
          <Circle cx="17" cy="20" r="1" />
        </Svg>
      );
    case 'utensils':
      return (
        <Svg {...common}>
          <Path d="M5 3 L5 11 Q 5 13 7 13 L7 21 M7 3 L7 11 M9 3 L9 11 Q 9 13 7 13" />
          <Path d="M15 3 Q 13 3 13 8 Q 13 11 15 11 L15 21" />
        </Svg>
      );

    // ── vendor categories ─────────────────────────────────────────
    case 'wrench':
      return (
        <Svg {...common}>
          <Path d="M14 4 Q 18 4 18 8 Q 18 10 16 11 L6 21 L3 18 L13 8 Q 12 6 14 4 Z" />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...common}>
          <Path d="M13 3 L4 14 L11 14 L9 21 L20 9 L13 9 Z" />
        </Svg>
      );
    case 'snow':
      return (
        <Svg {...common}>
          <Path d="M12 3 L12 21 M3 12 L21 12 M5 5 L19 19 M19 5 L5 19" />
        </Svg>
      );
    case 'doctor':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="3.5" />
          <Path d="M5 21 Q 5 14 12 14 Q 19 14 19 21" />
          <Path d="M9 18 L9 16 L15 16 L15 18" />
        </Svg>
      );
    case 'tailor':
      return (
        <Svg {...common}>
          <Circle cx="7" cy="7" r="2" />
          <Circle cx="7" cy="17" r="2" />
          <Path d="M8.5 8 L20 20 M8.5 16 L20 4" />
        </Svg>
      );
    case 'hammer':
      return (
        <Svg {...common}>
          <Path d="M4 4 L9 4 L13 8 L9 12 L4 12 Z" />
          <Path d="M10 10 L21 21" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...common}>
          <Path d="M4 20 Q 4 8 16 4 Q 22 8 18 16 Q 14 22 4 20 Z" />
          <Path d="M4 20 Q 10 14 16 8" />
        </Svg>
      );
    case 'broom':
      return (
        <Svg {...common}>
          <Path d="M4 18 L11 11 L17 5 L20 8 L14 14 L7 21 Z" />
          <Path d="M14 8 L17 11" />
        </Svg>
      );
    case 'car':
      return (
        <Svg {...common}>
          <Path d="M4 16 L4 13 Q 5 9 7 8 L17 8 Q 19 9 20 13 L20 16 Q 20 17 19 17 L18 17 Q 17 17 17 18 L17 19 Q 17 20 16 20 L15 20 Q 14 20 14 19 L14 18 Q 14 17 13 17 L11 17 Q 10 17 10 18 L10 19 Q 10 20 9 20 L8 20 Q 7 20 7 19 L7 18 Q 7 17 6 17 L5 17 Q 4 17 4 16 Z" />
          <Circle cx="8" cy="13" r="1" />
          <Circle cx="16" cy="13" r="1" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...common}>
          <Path d="M4 6 L20 6 M4 12 L20 12 M4 18 L20 18" />
          <Circle cx="4" cy="6" r="0.5" fill={c} />
          <Circle cx="4" cy="12" r="0.5" fill={c} />
          <Circle cx="4" cy="18" r="0.5" fill={c} />
        </Svg>
      );

    // ── states / activity ─────────────────────────────────────────
    case 'goal':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8" />
          <Circle cx="12" cy="12" r="4" />
          <Circle cx="12" cy="12" r="1" fill={c} />
        </Svg>
      );
    case 'chart':
      return (
        <Svg {...common}>
          <Path d="M4 20 L4 4" />
          <Path d="M4 20 L20 20" />
          <Path d="M7 17 L7 13 M11 17 L11 9 M15 17 L15 11 M19 17 L19 6" />
        </Svg>
      );
    case 'report':
      return (
        <Svg {...common}>
          <Path d="M4 5 Q 4 4 5 4 L17 4 Q 17 4 18 5 L20 7 Q 20 8 20 8 L20 20 Q 20 21 19 21 L5 21 Q 4 21 4 20 Z" />
          <Path d="M8 11 L16 11 M8 14 L16 14 M8 17 L13 17" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common}>
          <Path d="M5 12 L19 12 L19 20 Q 19 21 18 21 L6 21 Q 5 21 5 20 Z" />
          <Path d="M8 12 L8 9 Q 8 5 12 5 Q 16 5 16 9 L16 12" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...common}>
          <Path d="M3 8 Q 3 6 5 6 L17 6 L17 4 Q 17 3 18 3 L20 3 Q 21 3 21 4 L21 18 Q 21 20 19 20 L5 20 Q 3 20 3 18 Z" />
          <Circle cx="17" cy="13" r="1" />
        </Svg>
      );
    case 'box':
      return (
        <Svg {...common}>
          <Path d="M3 7 L12 3 L21 7 L21 17 L12 21 L3 17 Z" />
          <Path d="M3 7 L12 12 L21 7 M12 12 L12 21" />
        </Svg>
      );
    case 'cycle':
      return (
        <Svg {...common}>
          <Path d="M12 4 Q 18 4 18 12 Q 18 20 12 20 Q 6 20 6 12 Q 6 4 12 4 Z" />
          <Path d="M12 4 Q 14 7 14 12 Q 14 17 12 20" />
          <Path d="M12 4 Q 10 7 10 12 Q 10 17 12 20" />
        </Svg>
      );
    case 'body':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="6" r="2.5" />
          <Path d="M8 21 L8 15 L6 11 L7 10 L9 13 L15 13 L17 10 L18 11 L16 15 L16 21" />
        </Svg>
      );
    case 'prayer':
      return (
        <Svg {...common}>
          <Path d="M5 20 L5 13 Q 5 12 6 12 L18 12 Q 19 12 19 13 L19 20" />
          <Path d="M12 12 Q 9 9 12 6 Q 15 9 12 12" />
          <Path d="M3 20 L21 20" />
        </Svg>
      );

    default:
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="6" />
        </Svg>
      );
  }
}

export const HennaIcon = React.memo(HennaIconImpl);
