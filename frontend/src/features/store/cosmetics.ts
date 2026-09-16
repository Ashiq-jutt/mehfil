import { palette } from '../../theme';

/**
 * Visual themes for Club Store cosmetics, keyed by seeded item code. Items without real artwork
 * are drawn from these tokens so equipping something is visible immediately in rooms and chat.
 */

const FRAMES: Record<string, [string, string]> = {
  frame_sapphire_crest: ['#9CC9FF', '#2F5FD6'],
  frame_amethyst_crown: ['#D8B4FE', '#7C3AED'],
  frame_ruby_bloom: ['#FDA4AF', '#BE123C'],
  frame_emerald_wreath: ['#A7F3D0', '#059669'],
  frame_royal_1: ['#F6A0B4', '#C93A63'],
  frame_royal_2: ['#9CC9FF', '#3B6FD6'],
  frame_royal_3: ['#FFC58A', '#E0762B'],
  frame_royal_4: ['#C9A6FF', '#7A3FD6'],
  frame_royal_5: ['#FF9BD6', '#C42B8B'],
  frame_royal_6: ['#A6F2C8', '#1F9D6A'],
  frame_prime_1: ['#FFE9A8', '#DDA535'],
  frame_prime_2: ['#E6E6FA', '#8F8FD9'],
  frame_prime_3: ['#FFD1FB', '#B04AC9'],
};

/** Gradient stops for an avatar frame; null for the default / unknown frame. */
export function frameColors(code?: string | null): [string, string] | null {
  return code ? FRAMES[code] ?? null : null;
}

export type BubbleTheme = { backgroundColor: string; borderColor: string };

const BUBBLES: Record<string, BubbleTheme> = {
  chatbubble_gold_scroll: { backgroundColor: 'rgba(122, 78, 10, 0.78)', borderColor: palette.gold300 },
  chatbubble_petal_frame: { backgroundColor: 'rgba(160, 30, 90, 0.72)', borderColor: palette.pink200 },
  chatbubble_crystal_edge: { backgroundColor: 'rgba(20, 70, 140, 0.72)', borderColor: '#BFE3FF' },
  chatbubble_royal_6: { backgroundColor: 'rgba(12, 90, 70, 0.75)', borderColor: '#A6F2C8' },
  chatbubble_royal_4: { backgroundColor: 'rgba(70, 30, 140, 0.78)', borderColor: '#C9A6FF' },
};

export function bubbleTheme(code?: string | null): BubbleTheme | null {
  return code ? BUBBLES[code] ?? null : null;
}

export type BackgroundTheme = {
  label: string;
  sky: [string, string, string];
  trophy: [string, string];
  ground: [string, string];
};

const DEFAULT_BACKGROUND: BackgroundTheme = {
  label: 'Night City',
  sky: [palette.violet950, palette.violet900, palette.plum900],
  trophy: ['#C98A3A', '#6B3F14'],
  ground: ['#3E7A3A', '#5FA657'],
};

const BACKGROUNDS: Record<string, BackgroundTheme> = {
  background_trophy_gold: { label: 'Golden Trophy', sky: ['#2A1B00', '#5A3A05', palette.plum900], trophy: ['#FFD86B', '#B8860B'], ground: ['#6B4F12', '#C9A227'] },
  background_trophy_silver: { label: 'Silver Trophy', sky: ['#1C2230', '#3A4560', palette.violet900], trophy: ['#E6ECF5', '#8A94A8'], ground: ['#4B5568', '#9AA5B8'] },
  background_trophy_bronze: { label: 'Bronze Trophy', sky: ['#2B1607', '#5A3418', palette.plum900], trophy: ['#F0B37A', '#8A4B1E'], ground: ['#5A3A1E', '#A66A3A'] },
  background_club_4: { label: 'Twilight', sky: ['#1B0B3F', '#4A1A7A', '#7C2C9E'], trophy: ['#C98A3A', '#6B3F14'], ground: ['#3E2A6A', '#6A47A8'] },
  background_club_20: { label: 'Sunset Beach', sky: ['#3A0F3F', '#C2410C', '#F59E0B'], trophy: ['#FFD86B', '#B8860B'], ground: ['#8A5A1E', '#E0B060'] },
  background_club_25: { label: 'Palm Cove', sky: ['#0B2A4A', '#1D6FA5', '#7FC8E8'], trophy: ['#C98A3A', '#6B3F14'], ground: ['#2E7D5B', '#5FBF8A'] },
  background_club_29: { label: 'Desert Dusk', sky: ['#2A0F2F', '#8B3A62', '#E07A5F'], trophy: ['#F0B37A', '#8A4B1E'], ground: ['#8A5A2E', '#D9A066'] },
  background_club_32: { label: 'Pink City', sky: ['#3B0764', '#9D174D', '#F472B6'], trophy: ['#FFD86B', '#B8860B'], ground: ['#6B2A5A', '#C2588F'] },
  background_club_34: { label: 'Neon Skyline', sky: ['#020617', '#1E1B4B', '#4C1D95'], trophy: ['#67E8F9', '#0E7490'], ground: ['#1E3A8A', '#38BDF8'] },
  background_club_36: { label: 'Deep Ocean', sky: ['#041F2B', '#0B4F6C', '#14919B'], trophy: ['#A7F3D0', '#0F766E'], ground: ['#0F5E5B', '#2DD4BF'] },
};

export function backgroundTheme(code?: string | null): BackgroundTheme {
  return (code && BACKGROUNDS[code]) || DEFAULT_BACKGROUND;
}

const ENTRY_STYLES: Record<string, { label: string; emoji: string }> = {
  entrystyle_speedboat: { label: 'Speedboat', emoji: '🚤' },
  entrystyle_jet: { label: 'Private Jet', emoji: '✈️' },
  entrystyle_balloon: { label: 'Hot Air Balloon', emoji: '🎈' },
  entrystyle_biplane: { label: 'Biplane', emoji: '🛩️' },
  entrystyle_helicopter: { label: 'Helicopter', emoji: '🚁' },
  entrystyle_parachute: { label: 'Parachute', emoji: '🪂' },
};

/** How a user arrives in the room; null for the default walk-in. */
export function entryStyle(code?: string | null): { label: string; emoji: string } | null {
  return code ? ENTRY_STYLES[code] ?? null : null;
}

const CARDS: Record<string, [string, string]> = {
  card_club_12: ['#7FC8E8', '#1D6FA5'],
  card_club_21: ['#F59E0B', '#B45309'],
  card_club_31: ['#F472B6', '#9D174D'],
  card_club_41: ['#A78BFA', '#5B21B6'],
  card_club_50: ['#FCA5A5', '#B91C1C'],
};

export function cardColors(code?: string | null): [string, string] {
  return (code && CARDS[code]) || [palette.violet400, palette.violet700];
}

const DP_TINTS: Record<string, string> = {
  clubdp_lantern: '#F59E0B',
  clubdp_mandala: '#8B5CF6',
  clubdp_teapot: '#D97706',
  clubdp_lamp: '#EAB308',
  clubdp_shield: '#B45309',
  clubdp_dunes: '#EA580C',
  clubdp_skyline: '#3B82F6',
  clubdp_harbour: '#0EA5E9',
};

export function dpTint(code?: string | null): string {
  return (code && DP_TINTS[code]) || palette.violet400;
}
