// One Euro filter (Casiez et al. 2012): heavy smoothing when still, low lag when moving fast.
const alpha = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

export class OneEuroFilter {
  private x: number | null = null
  private dx = 0
  private t = 0

  constructor(
    private minCutoff = 1.0,
    private beta = 0.007,
    private dCutoff = 1.0,
  ) {}

  filter(value: number, timestampMs: number): number {
    if (this.x === null) {
      this.x = value
      this.t = timestampMs
      return value
    }
    const dt = Math.max((timestampMs - this.t) / 1000, 1e-3)
    this.t = timestampMs

    const rawDx = (value - this.x) / dt
    this.dx += alpha(this.dCutoff, dt) * (rawDx - this.dx)

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += alpha(cutoff, dt) * (value - this.x)
    return this.x
  }

  reset() {
    this.x = null
    this.dx = 0
  }
}
