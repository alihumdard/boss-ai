/** What the assistant is currently doing. Drives the orb's intensity. */
export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface VoiceOrbProps {
  /** Current assistant state. */
  state?: OrbState;
  /** Normalised 0-1 microphone level. Drives displacement and glow. */
  audioLevel?: number;
  /** Rendered size in px (square). Ignored when `fill` is set. */
  size?: number;
  /** Fill the parent box instead of using a fixed pixel size. */
  fill?: boolean;
  /** Caption under the orb. */
  label?: string;
  className?: string;
}
