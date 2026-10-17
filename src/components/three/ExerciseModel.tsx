import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { HumanRig } from '../../rig/HumanRig'
import { DEG } from '../../rig/limits'
import { getMotion, samplePose, stepTime } from '../../rig/motions'
import type { ProgressionLevel } from '../../data/progression'

function AutoFit({ children }: { children: React.ReactNode }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const g = groupRef.current
    if (!g) return
    const box = new THREE.Box3().setFromObject(g)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = 2 / size.y
    g.scale.setScalar(s)
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    camera.lookAt(0, 0.8, 0)
  }, [camera])

  return <group ref={groupRef}>{children}</group>
}

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
    rig.current ??= HumanRig.create(rigRoot.current, scene)
    if (!rig.current) return
    if (playing && currentStep === undefined) time.current += dt * speed
    rig.current.apply(samplePose(motion, time.current), motion.kneePole, motion.elbowPole)
  })

  return (
    <group rotation={[0, (motion?.view ?? 0) * DEG, 0]}>
      <group ref={rigRoot}>
        <primitive object={scene} />
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
      <Canvas camera={{ position: [0, 1.1, 4.2], fov: 38 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <hemisphereLight args={["#ffffff", "#b8b2a6", 1.1]} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <AutoFit>
            <RiggedModel url={modelUrl} exerciseId={exerciseId} playing={playing} speed={speed} currentStep={currentStep} totalSteps={totalSteps} />
          </AutoFit>
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={5} blur={2.5} far={4} />
        </Suspense>
      </Canvas>
    </div>
  )
}
