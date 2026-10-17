export const DEG = Math.PI / 180

export type Range = readonly [min: number, max: number]

// Human range of motion in degrees. Hinge joints bend one way only.
export const JOINT_LIMITS = {
  knee: [3, 150],
  elbow: [3, 150],
  hipPitch: [-20, 95],
  spine: [-25, 60],
  neck: [-45, 45],
} as const satisfies Record<string, Range>

export const clamp = (v: number, [min, max]: Range) => Math.min(max, Math.max(min, v))
