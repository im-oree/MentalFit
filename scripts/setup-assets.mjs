import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDest = resolve(root, 'public/mediapipe/wasm')
const MODELS = ['lite', 'full', 'heavy']

mkdirSync(wasmDest, { recursive: true })
cpSync(wasmSrc, wasmDest, { recursive: true })

for (const variant of MODELS) {
  const name = `pose_landmarker_${variant}`
  const dest = resolve(root, `public/mediapipe/models/${name}.task`)
  if (existsSync(dest)) continue
  mkdirSync(dirname(dest), { recursive: true })
  const res = await fetch(`https://storage.googleapis.com/mediapipe-models/pose_landmarker/${name}/float16/latest/${name}.task`)
  if (!res.ok) throw new Error(`${name} download failed: ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

console.log('MediaPipe assets ready')
