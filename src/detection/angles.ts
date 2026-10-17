type Point = { x: number; y: number }

export function angleDeg(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const cross = ab.x * cb.y - ab.y * cb.x
  return Math.abs(Math.atan2(cross, dot) * (180 / Math.PI))
}

export function avgAngle(
  landmarks: Point[],
  aL: number, bL: number, cL: number,
  aR: number, bR: number, cR: number,
): number {
  const left = angleDeg(landmarks[aL], landmarks[bL], landmarks[cL])
  const right = angleDeg(landmarks[aR], landmarks[bR], landmarks[cR])
  return (left + right) / 2
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
