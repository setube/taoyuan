import { ref } from "vue";

// 末日生存：回合制，无实时时钟。保留 composable 以兼容调用方，start/stop 为空操作。
const gameSpeed = ref(1);
const isPaused = ref(true);

export const useGameClock = () => {
  const startClock = () => {};
  const stopClock = () => {};
  const pauseClock = () => {};
  const resumeClock = () => {};
  const setSpeed = (speed: number) => {
    gameSpeed.value = speed;
  };
  const cycleSpeed = () => {
    gameSpeed.value = gameSpeed.value >= 3 ? 1 : gameSpeed.value + 1;
  };
  const togglePause = () => {
    isPaused.value = !isPaused.value;
  };

  return {
    gameSpeed,
    isPaused,
    startClock,
    stopClock,
    pauseClock,
    resumeClock,
    setSpeed,
    cycleSpeed,
    togglePause,
  };
};
