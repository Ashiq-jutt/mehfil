/**
 * Turns noisy per-interval volume reports into stable speaking on/off transitions.
 * Pure so it can be unit tested without the Agora engine.
 */
export class SpeakingDetector {
  private speaking = false;
  private quietSince: number | null = null;

  constructor(
    private readonly threshold = 25,
    private readonly holdMs = 700,
  ) {}

  /** Returns the new state when it changed, otherwise null. */
  update(volume: number, now: number): boolean | null {
    if (volume >= this.threshold) {
      this.quietSince = null;
      if (!this.speaking) {
        this.speaking = true;
        return true;
      }
      return null;
    }

    if (!this.speaking) {
      return null;
    }
    this.quietSince ??= now;
    if (now - this.quietSince >= this.holdMs) {
      this.speaking = false;
      this.quietSince = null;
      return false;
    }
    return null;
  }

  reset(): boolean | null {
    const was = this.speaking;
    this.speaking = false;
    this.quietSince = null;
    return was ? false : null;
  }
}
