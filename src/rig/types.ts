export type Vec3 = [number, number, number]

// Units are body heights (H). Rig space: +Y up, +Z the way the body faces, +X the body's left.
export interface Pose {
  drop: number
  shiftZ: number
  pitch: number
  spine: number
  lHand: Vec3
  rHand: Vec3
  lFoot: Vec3
  rFoot: Vec3
}

export interface Motion {
  view: number
  duration: number
  keys: { t: number; pose: Pose }[]
  stepTimes: number[]
  kneePole?: Vec3
  elbowPole?: Vec3
}
