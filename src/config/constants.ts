/** Logical screen height; zoom = floor(renderHeight / LOGICAL_H) (D-38: 1080p → ×3). */
export const LOGICAL_H = 360;
/** Bounds of the visible logical height when the player fixes the zoom (Settings → Zoom). */
export const LOGICAL_H_MIN = 240;
export const LOGICAL_H_MAX = 720;

/** Animation speed multipliers (Settings, or TAB at the table; D-57). */
export const GAME_SPEEDS = [1, 2, 4] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
