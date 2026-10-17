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
const UP = new THREE.Vector3(0, 1, 0)

// Body frame: measured from the skeleton so any export orientation works. x = body's left, y = up, z = facing.
interface BodyFrame {
  left: THREE.Vector3
  forward: THREE.Vector3
}

// Drives a Mixamo-style skeleton from a Pose: FK for hips/spine/neck, IK for limbs, all clamped to human limits.
export class HumanRig {
  private constructor(
    private root: THREE.Object3D,
    private bones: Bones,
    private rest: RestPose,
    readonly frame: BodyFrame,
    readonly H: number,
    readonly groundY: number,
    readonly hipsRest: THREE.Vector3,
    private lFootNeutral: THREE.Vector3,
    private rFootNeutral: THREE.Vector3,
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
      // GLB node transforms hold a frame of the exported animation; reset to the skin's bind pose first.
      HumanRig.toBindPose(model)
      rest = new Map()
      model.traverse((o) => { if (o instanceof THREE.Bone) rest!.set(o, { q: o.quaternion.clone(), p: o.position.clone() }) })
      model.userData.restPose = rest
    }
    HumanRig.restore(rest)
    root.updateMatrixWorld(true)

    const local = (b: THREE.Object3D) => root.worldToLocal(b.getWorldPosition(new THREE.Vector3()))
    const groundY = Math.min(local(bones.LeftToeBase).y, local(bones.RightToeBase).y)
    const H = local(bones.HeadTop_End).y - groundY

    const lHip = local(bones.LeftUpLeg)
    const rHip = local(bones.RightUpLeg)
    const left = lHip.clone().sub(rHip).setY(0).normalize()
    const forward = left.clone().cross(UP).normalize()

    const ankleY = (local(bones.LeftFoot).y + local(bones.RightFoot).y) / 2
    const hips = local(bones.Hips)
    const stance = (hip: THREE.Vector3) => new THREE.Vector3(hip.x, ankleY, hip.z)

    return new HumanRig(root, bones, rest, { left, forward }, H, groundY, hips, stance(lHip), stance(rHip))
  }

  // Undeformed skin needs bone.matrixWorld = mesh.matrixWorld · bindMatrix⁻¹ · boneInverse⁻¹ (skeleton.pose() drops the mesh terms).
  private static toBindPose(model: THREE.Object3D) {
    let mesh: THREE.SkinnedMesh | undefined
    model.traverse((o) => { if (!mesh && (o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.SkinnedMesh })
    if (!mesh) return
    model.updateMatrixWorld(true)
    let rootBone: THREE.Object3D = mesh.skeleton.bones[0]
    while (rootBone.parent && (rootBone.parent as THREE.Bone).isBone) rootBone = rootBone.parent
    const base = rootBone.parent!.matrixWorld.clone().multiply(mesh.bindMatrix.clone().invert())
    const { bones, boneInverses } = mesh.skeleton
    const target = new THREE.Matrix4()
    const local = new THREE.Matrix4()
    model.traverse((o) => {
      const i = bones.indexOf(o as THREE.Bone)
      if (i < 0 || /_End/.test(o.name)) return
      target.copy(base).multiply(boneInverses[i].clone().invert())
      local.copy(o.parent!.matrixWorld).invert().multiply(target)
      local.decompose(o.position, o.quaternion, o.scale)
      o.updateMatrixWorld(true)
    })
  }

  private static restore(rest: RestPose) {
    rest.forEach(({ q, p }, o) => { o.quaternion.copy(q); o.position.copy(p) })
  }

  private body([x, y, z]: Vec3, scale = 1) {
    return this.frame.left.clone().multiplyScalar(x * scale).addScaledVector(UP, y * scale).addScaledVector(this.frame.forward, z * scale)
  }

  private toWorld(v: THREE.Vector3) {
    return this.root.localToWorld(v)
  }

  private worldAxis(v: THREE.Vector3) {
    return v.clone().transformDirection(this.root.matrixWorld)
  }

  private bodyRotation(angle: number) {
    return new THREE.Quaternion().setFromAxisAngle(this.worldAxis(this.frame.left), angle)
  }

  private poleDir(pole: Vec3, pitch: number) {
    return this.worldAxis(this.body(pole).applyAxisAngle(this.frame.left, pitch))
  }

  apply(pose: Pose, kneePole: Vec3 = [0, 0, 1], elbowPole: Vec3 = [0, -0.3, -1]) {
    const { bones: b, H } = this
    HumanRig.restore(this.rest)
    this.root.updateMatrixWorld(true)

    const hipsTarget = this.toWorld(this.hipsRest.clone().add(this.body([0, -pose.drop, pose.shiftZ], H)))
    b.Hips.position.copy(b.Hips.parent!.worldToLocal(hipsTarget))
    b.Hips.updateMatrixWorld(true)

    const pitch = clamp(pose.pitch, JOINT_LIMITS.hipPitch) * DEG
    rotateWorld(b.Hips, this.bodyRotation(pitch))

    const spine = clamp(pose.spine, JOINT_LIMITS.spine) * DEG
    for (const s of [b.Spine, b.Spine1, b.Spine2]) rotateWorld(s, this.bodyRotation(spine / 3))

    const neck = clamp(-(pose.pitch + pose.spine) * 0.5, JOINT_LIMITS.neck) * DEG
    rotateWorld(b.Neck, this.bodyRotation(neck))

    const foot = (neutral: THREE.Vector3, offset: Vec3) => this.toWorld(neutral.clone().add(this.body(offset, H)))
    solveTwoBone(b.LeftUpLeg, b.LeftLeg, b.LeftFoot, foot(this.lFootNeutral, pose.lFoot), this.poleDir([kneePole[0] + 0.15, kneePole[1], kneePole[2]], pitch), JOINT_LIMITS.knee)
    solveTwoBone(b.RightUpLeg, b.RightLeg, b.RightFoot, foot(this.rFootNeutral, pose.rFoot), this.poleDir([kneePole[0] - 0.15, kneePole[1], kneePole[2]], pitch), JOINT_LIMITS.knee)

    const origin = new THREE.Vector3(this.hipsRest.x, this.groundY, this.hipsRest.z)
    const hand = (p: Vec3) => this.toWorld(origin.clone().add(this.body(p, H)))
    solveTwoBone(b.LeftArm, b.LeftForeArm, b.LeftHand, hand(pose.lHand), this.poleDir([elbowPole[0] + 0.4, elbowPole[1], elbowPole[2]], pitch), JOINT_LIMITS.elbow)
    solveTwoBone(b.RightArm, b.RightForeArm, b.RightHand, hand(pose.rHand), this.poleDir([elbowPole[0] - 0.4, elbowPole[1], elbowPole[2]], pitch), JOINT_LIMITS.elbow)
  }
}
