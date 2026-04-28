import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { motionScale, motionSpring } from "../constants/motion";

type SpringConfig = {
  damping: number;
  stiffness: number;
  mass: number;
};

type Options = {
  /** Scale while pressed (default = button). */
  pressedScale?: number;
  spring?: SpringConfig;
};

/**
 * Shared press feedback: slight spring scale-in on press for Pressable-driven surfaces.
 */
export function usePressScale(disabled: boolean, options?: Options) {
  const pressedScale = options?.pressedScale ?? motionScale.buttonPressed;
  const springConfig = options?.spring ?? motionSpring.press;

  const scale = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      scale.value = 1;
    }
  }, [disabled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const onPressIn = () => {
    if (!disabled) {
      scale.value = withSpring(pressedScale, springConfig);
    }
  };

  const onPressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
