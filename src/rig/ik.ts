import * as THREE from 'three'
import { DEG, clamp, type Range } from './limits'

const _q = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()

export function setWorldQuaternion(obj: THREE.Object3D, worldQ: THREE.Quaternion) {
  obj.parent!.getWorldQuaternion(_q2)
  obj.quaternion.copy(_q2.invert().multiply(worldQ))
  obj.updateMatrixWorld(true)
}

export function rotateWorld(obj: THREE.Object3D, worldDelta: THREE.Quaternion) {
  obj.getWorldQuaternion(_q)
  setWorldQuaternion(obj, _q.premultiply(worldDelta))
}

// Rotates `bone` so that `child` moves onto `desired` (world space).
export function aim(bone: THREE.Object3D, child: THREE.Object3D, desired: THREE.Vector3) {
  bone.getWorldPosition(_a)
  child.getWorldPosition(_b)
  const cur = _b.sub(_a).normalize()
  const des = _c.copy(desired).sub(_a).normalize()
  rotateWorld(bone, new THREE.Quaternion().setFromUnitVectors(cur, des))
}

// Analytic two-bone IK with a pole hint and a clamped hinge bend.
export function solveTwoBone(
  root: THREE.Object3D,
  mid: THREE.Object3D,
  end: THREE.Object3D,
  target: THREE.Vector3,
  pole: THREE.Vector3,
  bendLimit: Range,
) {
  const a = root.getWorldPosition(new THREE.Vector3())
  const m = mid.getWorldPosition(new THREE.Vector3())
  const e = end.getWorldPosition(new THREE.Vector3())
  const l1 = a.distanceTo(m)
  const l2 = m.distanceTo(e)

  const toTarget = target.clone().sub(a)
  let d = Math.min(Math.max(toTarget.length(), Math.abs(l1 - l2) + 1e-4), (l1 + l2) * 0.999)

  const interior = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), [-1, 1]))
  const bend = clamp((Math.PI - interior) / DEG, bendLimit) * DEG
  d = Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(Math.PI - bend))

  const dir = toTarget.normalize()
  const side = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)))
  if (side.lengthSq() < 1e-8) side.set(0, 1, 0).sub(dir.clone().multiplyScalar(dir.y))
  side.normalize()

  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), [-1, 1])
  const sinA = Math.sqrt(1 - cosA * cosA)
  const midDesired = a.clone().addScaledVector(dir, cosA * l1).addScaledVector(side, sinA * l1)

  aim(root, mid, midDesired)
  aim(mid, end, a.clone().addScaledVector(dir, d))
}
