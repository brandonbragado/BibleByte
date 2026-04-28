/** Shared motion presets — subtle springs so UI feels responsive without feeling flashy. */

export const motionSpring = {
  /** Primary taps (buttons, key CTAs) */
  press: { damping: 17, stiffness: 420, mass: 0.35 },
  /** Larger surfaces (cards, rows) */
  pressSoft: { damping: 19, stiffness: 340, mass: 0.45 }
} as const;

export const motionScale = {
  buttonPressed: 0.97,
  surfacePressed: 0.985
} as const;
