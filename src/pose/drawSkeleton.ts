import type { SmoothedLandmark } from './poseTracker'

const MIN_VISIBILITY = 0.55

// BlazePose indices: odd = left, even = right. Face (1–10) omitted; nose (0) anchors the head.
const LEFT = [11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]
const RIGHT = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
const BONES: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]
const JOINTS = [0, ...LEFT, ...RIGHT]

const COLOR_LEFT = '10, 132, 255'
const COLOR_RIGHT = '48, 209, 88'
const sideColor = (i: number) => (LEFT.includes(i) ? COLOR_LEFT : RIGHT.includes(i) ? COLOR_RIGHT : '255, 255, 255')

export type FrameGeometry = { videoWidth: number; videoHeight: number; width: number; height: number }

// Maps normalized landmarks onto a canvas that mirrors the video's `object-fit: cover`.
export function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: SmoothedLandmark[] | null, g: FrameGeometry) {
  ctx.clearRect(0, 0, g.width, g.height)
  if (!landmarks) return

  const scale = Math.max(g.width / g.videoWidth, g.height / g.videoHeight)
  const ox = (g.width - g.videoWidth * scale) / 2
  const oy = (g.height - g.videoHeight * scale) / 2
  const px = (l: SmoothedLandmark) => [l.x * g.videoWidth * scale + ox, l.y * g.videoHeight * scale + oy] as const
  const unit = Math.min(g.width, g.height) / 100

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const [a, b] of BONES) {
    const la = landmarks[a]
    const lb = landmarks[b]
    const alpha = Math.min(la.visibility, lb.visibility)
    if (alpha < MIN_VISIBILITY) continue
    const [x1, y1] = px(la)
    const [x2, y2] = px(lb)
    const color = a % 2 === b % 2 ? sideColor(a) : '255, 255, 255'

    ctx.strokeStyle = `rgba(${color}, ${0.25 * alpha})`
    ctx.lineWidth = unit * 2.2
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * alpha})`
    ctx.lineWidth = unit * 0.7
    ctx.stroke()
  }

  for (const i of JOINTS) {
    const l = landmarks[i]
    if (l.visibility < MIN_VISIBILITY) continue
    const [x, y] = px(l)
    const r = i === 0 ? unit * 1.6 : unit * 1.1

    ctx.fillStyle = `rgba(${sideColor(i)}, ${l.visibility})`
    ctx.beginPath()
    ctx.arc(x, y, r + unit * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(255, 255, 255, ${l.visibility})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}
