import { useEffect, useState } from "react";
import { useSpring, useMotionValueEvent, useReducedMotion } from "motion/react";

export default function useAnimatedCounter(target: number): number {
  const shouldReduceMotion = useReducedMotion();
  const spring = useSpring(target, { visualDuration: 0.4, bounce: 0 });
  const [displayed, setDisplayed] = useState(target);

  useEffect(() => {
    // Always keep the spring in sync so it has the right value if reducedMotion
    // turns off at runtime. But if motion is reduced, bypass the spring output
    // and jump straight to target — MotionConfig reducedMotion="user" only
    // suppresses transform/layout animations on m.* components, not useSpring.
    spring.set(target);
    if (shouldReduceMotion) setDisplayed(target);
  }, [target, spring, shouldReduceMotion]);

  useMotionValueEvent(spring, "change", (value) => {
    if (!shouldReduceMotion) setDisplayed(Math.round(value));
  });

  return displayed;
}
