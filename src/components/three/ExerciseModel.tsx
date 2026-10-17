import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { HumanRig } from '../../rig/HumanRig'
import { DEG } from '../../rig/limits'
import { getMotion, samplePose, stepTime } from '../../rig/motions'
import type { ProgressionLevel } from '../../data/progression'

const MODEL_HEIGHT = 2
const Y_AXIS = new THREE.Vector3(0, 1, 0)

interface ModelProps {
  url: string
  exerciseId: string
  playing: boolean
  speed?: number
  currentStep?: number
  totalSteps?: number
}

function RiggedModel({ url, exerciseId, playing, speed = 1, currentStep, totalSteps }: ModelProps) {
  const { scene } = useGLTF(url)
  const fit = useRef<THREE.Group>(null)
  const rigRoot = useRef<THREE.Group>(null)
  const rig = useRef<HumanRig | null>(null)
  const time = useRef(0)
  const motion = getMotion(exerciseId)

  useEffect(() => { rig.current = null; time.current = 0 }, [exerciseId, scene])

  useEffect(() => {
    if (motion && currentStep !== undefined && totalSteps) time.current = stepTime(motion, currentStep, totalSteps)
  }, [motion, currentStep, totalSteps])

  useFrame((_, dt) => {
    if (!motion || !rigRoot.current) return
    if (!rig.current) {
      rig.current = HumanRig.create(rigRoot.current, scene)
      if (!rig.current) return
      const { H, groundY, hipsRest, frame } = rig.current
      const yaw = -Math.atan2(frame.forward.x, frame.forward.z)
      const center = new THREE.Vector3(hipsRest.x, groundY, hipsRest.z).applyAxisAngle(Y_AXIS, yaw)
      rigRoot.current.rotation.y = yaw
      rigRoot.current.position.copy(center.negate())
      fit.current!.scale.setScalar(MODEL_HEIGHT / H)
      fit.current!.visible = true
    }
    if (playing && currentStep === undefined) time.current += dt * speed
    rig.current.apply(samplePose(motion, time.current), motion.kneePole, motion.elbowPole)
  })

  return (
    <group ref={fit} visible={false}>
      <group rotation={[0, (motion?.view ?? 0) * DEG, 0]}>
        <group ref={rigRoot}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  )
}

interface ExerciseModelViewerProps {
  modelUrl: string
  exerciseId: string
  playing: boolean
  speed?: number
  currentStep?: number
  totalSteps?: number
  progression?: ProgressionLevel
  className?: string
}

export function ExerciseModelViewer({ modelUrl, exerciseId, playing, speed, currentStep, totalSteps, className = '' }: ExerciseModelViewerProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas camera={{ position: [0, 1.1, 4.2], fov: 38 }} onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <hemisphereLight args={["#ffffff", "#b8b2a6", 1.1]} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <RiggedModel url={modelUrl} exerciseId={exerciseId} playing={playing} speed={speed} currentStep={currentStep} totalSteps={totalSteps} />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={5} blur={2.5} far={4} />
        </Suspense>
      </Canvas>
    </div>
  )
}
