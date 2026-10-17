import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Environment, ContactShadows, Center } from '@react-three/drei'
import * as THREE from 'three'
import type { ProgressionLevel } from '../../data/progression'

interface ModelProps {
  url: string
  animationName?: string
  playing: boolean
  speed?: number
  currentStep?: number
  totalSteps?: number
  progression?: ProgressionLevel
}

function AutoFit({ children }: { children: React.ReactNode }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 10) {
      const s = 2 / maxDim
      groupRef.current.scale.setScalar(s)
      groupRef.current.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    }

    const newBox = new THREE.Box3().setFromObject(groupRef.current)
    const newCenter = newBox.getCenter(new THREE.Vector3())
    ;(camera as THREE.PerspectiveCamera).lookAt(newCenter)
  }, [camera])

  return <group ref={groupRef}>{children}</group>
}

function AnimatedModel({ url, animationName, playing, speed = 1, currentStep, totalSteps, progression }: ModelProps) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(url)
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    const name = names[0]
    if (!name || !actions[name]) return

    const action = actions[name]!
    action.reset()
    action.setEffectiveTimeScale(speed)
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.clampWhenFinished = true

    if (playing) {
      action.play()
    } else {
      action.play()
      action.paused = true
    }

    return () => { action.stop() }
  }, [actions, names, playing, speed])

  useEffect(() => {
    if (currentStep === undefined || totalSteps === undefined) return
    const name = names[0]
    if (!name || !actions[name]) return

    const action = actions[name]!
    const clip = action.getClip()
    const stepDuration = clip.duration / totalSteps
    action.time = currentStep * stepDuration
    action.paused = true
    action.play()
  }, [currentStep, totalSteps, actions, names, animationName])

  useFrame(() => {
    if (group.current && !playing && currentStep === undefined) {
      group.current.rotation.y += 0.003
    }
  })

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

interface ExerciseModelViewerProps {
  modelUrl: string
  animationName?: string
  playing: boolean
  speed?: number
  currentStep?: number
  totalSteps?: number
  progression?: ProgressionLevel
  className?: string
}

export function ExerciseModelViewer({
  modelUrl,
  animationName,
  playing,
  speed,
  currentStep,
  totalSteps,
  progression,
  className = '',
}: ExerciseModelViewerProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <AutoFit>
            <AnimatedModel
              url={modelUrl}
              animationName={animationName}
              playing={playing}
              speed={speed}
              currentStep={currentStep}
              totalSteps={totalSteps}
              progression={progression}
            />
          </AutoFit>
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.4}
            scale={5}
            blur={2.5}
            far={4}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  )
}
