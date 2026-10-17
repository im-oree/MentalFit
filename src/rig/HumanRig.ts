import * as THREE from 'three'
import { DEG, JOINT_LIMITS, clamp } from './limits'
import { rotateWorld, solveTwoBone } from './ik'
import type { Pose, Vec3 } from './types'

const KEYS = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'HeadTop_End',
  'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
] as const
type Key = (typeof KEYS)[number]
type Bones = Record<Key, THREE.Bone>

type RestPose = Map<THREE.Object3D, { q: THREE.Quaternion; p: THREE.Vector3 }>

const normalizeName = (n: string) => n.replace(/^mixamorig:?/, '').replace(/_\d+$/, '')
const X_AXIS = new THREE.Vector3(1, 0, 0)

// Drives a Mixamo-style skeleton from a Pose: FK for hips/spine/neck, IK for limbs, all clamped to human limits.
export class HumanRig {
  private constructor(
    private root: THREE.Object3D,
    private bones: Bones,
    private rest: RestPose,
    private H: number,
    private groundY: number,
    private hipsRest: THREE.Vector3,
    private lFootRest: THREE.Vector3,
    private rFootRest: THREE.Vector3,
  ) {}

  static create(root: THREE.Object3D, model: THREE.Object3D): HumanRig | null {
    const found: Partial<Bones> = {}
    model.traverse((o) => {
      if (!(o instanceof THREE.Bone)) return
      const key = normalizeName(o.name) as Key
      if (KEYS.includes(key) && !found[key]) found[key] = o
    })
    if (KEYS.some((k) => !found[k])) return null
    const bones = found as Bones

    model.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.frustumCulled = false })

    let rest = model.userData.restPose as RestPose | undefined
    if (!rest) {
      rest = new Map()
      model.traverse((o) => { if (o instanceof THREE.Bone) rest!.set(o, { q: o.quaternion.clone(), p: o.position.clone() }) })
      model.userData.restPose = rest
    }
    HumanRig.restore(rest)
    root.updateMatrixWorld(true)

    const local = (b: THREE.Object3D) => root.worldToLocal(b.getWorldPosition(new THREE.Vector3()))
    const groundY = Math.min(local(bones.LeftToeBase).y, local(bones.RightToeBase).y)
    const H = local(bones.HeadTop_End).y - groundY

    return new HumanRig(root, bones, rest, H, groundY, local(bones.Hips), local(bones.LeftFoot), local(bones.RightFoot))
  }

  private static restore(rest: RestPose) {
    rest.forEach(({ q, p }, o) => { o.quaternion.copy(q); o.position.copy(p) })
  }

  private toWorld(v: THREE.Vector3) {
    return this.root.localToWorld(v)
  }

  private worldDir([x, y, z]: Vec3, pitchQ: THREE.Quaternion) {
    return new THREE.Vector3(x, y, z).applyQuaternion(pitchQ).transformDirection(this.root.matrixWorld)
  }

  private worldAxisRotation(angle: number) {
    const rootQ = this.root.getWorldQuaternion(new THREE.Quaternion())
    const axis = X_AXIS.clone().applyQuaternion(rootQ)
    return new THREE.Quaternion().setFromAxisAngle(axis, angle)
  }

  apply(pose: Pose, kneePole: Vec3 = [0, 0, 1], elbowPole: Vec3 = [0, -0.3, -1]) {
    const { bones: b, H } = this
    HumanRig.restore(this.rest)
    this.root.updateMatrixWorld(true)

    const hipsTarget = this.toWorld(this.hipsRest.clone().add(new THREE.Vector3(0, -pose.drop * H, pose.shiftZ * H)))
    b.Hips.position.copy(b.Hips.parent!.worldToLocal(hipsTarget))
    b.Hips.updateMatrixWorld(true)

    const pitch = clamp(pose.pitch, JOINT_LIMITS.hipPitch) * DEG
    rotateWorld(b.Hips, this.worldAxisRotation(pitch))

    const spine = clamp(pose.spine, JOINT_LIMITS.spine) * DEG
    for (const s of [b.Spine, b.Spine1, b.Spine2]) rotateWorld(s, this.worldAxisRotation(spine / 3))

    const neck = clamp(-(pose.pitch + pose.spine) * 0.5, JOINT_LIMITS.neck) * DEG
    rotateWorld(b.Neck, this.worldAxisRotation(neck))

    const pitchQ = new THREE.Quaternion().setFromAxisAngle(X_AXIS, pitch)

    const foot = (rest: THREE.Vector3, [x, y, z]: Vec3) => this.toWorld(rest.clone().add(new THREE.Vector3(x * H, y * H, z * H)))
    solveTwoBone(b.LeftUpLeg, b.LeftLeg, b.LeftFoot, foot(this.lFootRest, pose.lFoot), this.worldDir([0.15, 0, 1].map((v, i) => v + kneePole[i] - [0, 0, 1][i]) as Vec3, pitchQ), JOINT_LIMITS.knee)
    solveTwoBone(b.RightUpLeg, b.RightLeg, b.RightFoot, foot(this.rFootRest, pose.rFoot), this.worldDir([-0.15 + kneePole[0], kneePole[1], kneePole[2]], pitchQ), JOINT_LIMITS.knee)

    const hand = ([x, y, z]: Vec3) => this.toWorld(new THREE.Vector3(x * H, this.groundY + y * H, z * H))
    solveTwoBone(b.LeftArm, b.LeftForeArm, b.LeftHand, hand(pose.lHand), this.worldDir([elbowPole[0] + 0.4, elbowPole[1], elbowPole[2]], pitchQ), JOINT_LIMITS.elbow)
    solveTwoBone(b.RightArm, b.RightForeArm, b.RightHand, hand(pose.rHand), this.worldDir([elbowPole[0] - 0.4, elbowPole[1], elbowPole[2]], pitchQ), JOINT_LIMITS.elbow)
  }
}
