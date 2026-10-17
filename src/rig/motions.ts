import type { Motion, Pose, Vec3 } from './types'

const hands = (x: number, y: number, z: number): Pick<Pose, 'lHand' | 'rHand'> => ({ lHand: [x, y, z], rHand: [-x, y, z] })
const feet = (x: number, y: number, z: number): Pick<Pose, 'lFoot' | 'rFoot'> => ({ lFoot: [x, y, z], rFoot: [-x, y, z] })

const pose = (p: Partial<Pose>): Pose => ({
  drop: 0, shiftZ: 0, pitch: 0, spine: 0,
  ...hands(0.11, 0.47, 0.02),
  ...feet(0, 0, 0),
  ...p,
})

const STAND = pose({})
const PLANK_HIGH = pose({ drop: 0.25, pitch: 78, ...hands(0.1, 0.02, 0.3), ...feet(0, 0, -0.47) })
const PLANK_LOW = pose({ drop: 0.36, pitch: 86, ...hands(0.1, 0.02, 0.3), ...feet(0, 0, -0.47) })
const SQUAT_BOTTOM = pose({ drop: 0.22, shiftZ: -0.1, pitch: 35, spine: 10, ...hands(0.1, 0.62, 0.3), ...feet(0.03, 0, 0) })
const CROUCH_HANDS_DOWN = pose({ drop: 0.3, shiftZ: -0.05, pitch: 50, spine: 15, ...hands(0.1, 0.02, 0.25), ...feet(0, 0, 0) })
const SIDE_VIEW = -90
const ELBOWS_BACK: Vec3 = [0, 0.3, -1]

export const MOTIONS: Record<string, Motion> = {
  pushup: {
    view: SIDE_VIEW, duration: 2, stepTimes: [0, 1, 2], elbowPole: ELBOWS_BACK,
    keys: [{ t: 0, pose: PLANK_HIGH }, { t: 1, pose: PLANK_LOW }, { t: 2, pose: PLANK_HIGH }],
  },
  squat: {
    view: -35, duration: 2.4, stepTimes: [0, 1.2, 2.4],
    keys: [{ t: 0, pose: STAND }, { t: 1.2, pose: SQUAT_BOTTOM }, { t: 2.4, pose: STAND }],
  },
  lunge: {
    view: -70, duration: 2.4, stepTimes: [0, 1.2, 2.4],
    keys: [
      { t: 0, pose: pose({ ...hands(0.13, 0.5, 0) }) },
      { t: 1.2, pose: pose({ drop: 0.2, ...hands(0.13, 0.32, 0), lFoot: [0, 0, 0.28], rFoot: [0, 0.04, -0.22] }) },
      { t: 2.4, pose: pose({ ...hands(0.13, 0.5, 0) }) },
    ],
  },
  jumping_jack: {
    view: 0, duration: 1, stepTimes: [0, 0.5, 1],
    keys: [
      { t: 0, pose: STAND },
      { t: 0.5, pose: pose({ drop: -0.03, ...hands(0.2, 1.05, 0), ...feet(0.12, 0, 0) }) },
      { t: 1, pose: STAND },
    ],
  },
  high_knees: {
    view: -35, duration: 0.8, stepTimes: [0, 0.2, 0.6],
    keys: [
      { t: 0, pose: STAND },
      { t: 0.2, pose: pose({ lFoot: [0, 0.25, 0.12], lHand: [0.12, 0.45, -0.05], rHand: [-0.12, 0.68, 0.15] }) },
      { t: 0.4, pose: STAND },
      { t: 0.6, pose: pose({ rFoot: [0, 0.25, 0.12], lHand: [0.12, 0.68, 0.15], rHand: [-0.12, 0.45, -0.05] }) },
      { t: 0.8, pose: STAND },
    ],
  },
  plank: {
    view: SIDE_VIEW, duration: 3, stepTimes: [0, 1.5], elbowPole: ELBOWS_BACK,
    keys: [
      { t: 0, pose: pose({ drop: 0.33, pitch: 82, ...hands(0.08, 0.02, 0.33), ...feet(0, 0, -0.47) }) },
      { t: 1.5, pose: pose({ drop: 0.34, pitch: 83, ...hands(0.08, 0.02, 0.33), ...feet(0, 0, -0.47) }) },
      { t: 3, pose: pose({ drop: 0.33, pitch: 82, ...hands(0.08, 0.02, 0.33), ...feet(0, 0, -0.47) }) },
    ],
  },
  burpee: {
    view: SIDE_VIEW, duration: 3, stepTimes: [0, 0.6, 1.2, 1.8, 2.5], elbowPole: ELBOWS_BACK,
    keys: [
      { t: 0, pose: STAND },
      { t: 0.6, pose: CROUCH_HANDS_DOWN },
      { t: 1.2, pose: PLANK_HIGH },
      { t: 1.5, pose: PLANK_LOW },
      { t: 1.8, pose: PLANK_HIGH },
      { t: 2.2, pose: CROUCH_HANDS_DOWN },
      { t: 2.5, pose: pose({ drop: -0.06, ...hands(0.12, 1.05, 0.02) }) },
      { t: 3, pose: STAND },
    ],
  },
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const lerpV = (a: Vec3, b: Vec3, u: number): Vec3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]
const smooth = (u: number) => u * u * (3 - 2 * u)

export function samplePose(m: Motion, time: number): Pose {
  const t = ((time % m.duration) + m.duration) % m.duration
  const i = Math.max(0, m.keys.findIndex((k, j) => j < m.keys.length - 1 && t >= k.t && t <= m.keys[j + 1].t))
  const a = m.keys[i]
  const b = m.keys[Math.min(i + 1, m.keys.length - 1)]
  const u = b.t > a.t ? smooth((t - a.t) / (b.t - a.t)) : 0
  return {
    drop: lerp(a.pose.drop, b.pose.drop, u),
    shiftZ: lerp(a.pose.shiftZ, b.pose.shiftZ, u),
    pitch: lerp(a.pose.pitch, b.pose.pitch, u),
    spine: lerp(a.pose.spine, b.pose.spine, u),
    lHand: lerpV(a.pose.lHand, b.pose.lHand, u),
    rHand: lerpV(a.pose.rHand, b.pose.rHand, u),
    lFoot: lerpV(a.pose.lFoot, b.pose.lFoot, u),
    rFoot: lerpV(a.pose.rFoot, b.pose.rFoot, u),
  }
}

export function stepTime(m: Motion, step: number, totalSteps: number) {
  return m.stepTimes[step] ?? (step / Math.max(totalSteps, 1)) * m.duration
}

export const getMotion = (exerciseId: string): Motion | undefined => MOTIONS[exerciseId]
