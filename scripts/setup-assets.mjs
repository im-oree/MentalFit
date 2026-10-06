import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDest = resolve(root, 'public/mediapipe/wasm')
const modelDest = resolve(root, 'public/mediapipe/models/pose_landmarker_full.task')
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'

mkdirSync(wasmDest, { recursive: true })
cpSync(wasmSrc, wasmDest, { recursive: true })

if (!existsSync(modelDest)) {
  mkdirSync(dirname(modelDest), { recursive: true })
  const res = await fetch(modelUrl)
  if (!res.ok) throw new Error(`Model download failed: ${res.status}`)
  writeFileSync(modelDest, Buffer.from(await res.arrayBuffer()))
}

console.log('MediaPipe assets ready')
