import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei'
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

function AnimatedModel({ url, animationName, playing, speed = 1, currentStep, totalSteps, progression }: ModelProps) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(url)
  const { actions, names } = useAnimations(animations, group)

  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    if (!progression) return
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Bone)) return
      const n = obj.name.toLowerCase()
      if (n.includes('spine') || n.includes('hips') || n.includes('abdomen')) {
        obj.scale.set(...progression.torsoScale)
      } else if (n.includes('shoulder') || n.includes('clavicle')) {
        obj.scale.set(...progression.shoulderScale)
      } else if (n.includes('arm') || n.includes('leg') || n.includes('thigh') || n.includes('calf')) {
        obj.scale.set(...progression.limbScale)
      }
    })
  }, [clonedScene, progression])

  useEffect(() => {
    const name = animationName ?? names[0]
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

    return () => {
      action.stop()
    }
  }, [actions, names, animationName, playing, speed])

  useEffect(() => {
    if (currentStep === undefined || totalSteps === undefined) return
    const name = animationName ?? names[0]
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
      <primitive object={clonedScene} scale={1} position={[0, -1, 0]} />
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
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />

        <Suspense fallback={null}>
          <AnimatedModel
            url={modelUrl}
            animationName={animationName}
            playing={playing}
            speed={speed}
            currentStep={currentStep}
            totalSteps={totalSteps}
            progression={progression}
          />
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={5}
            blur={2.5}
            far={4}
          />
          <Environment preset="studio" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
