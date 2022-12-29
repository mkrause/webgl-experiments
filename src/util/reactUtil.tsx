
import * as React from 'react';


/*
A hook that takes an animation callback and runs it once every animation frame (using
requestAnimationFrame). The animation can be deferred/stopped by passing `null`.

Based on:
  - https://mobile.twitter.com/hieuhlc/status/1164369876825169920
  - https://github.com/franciscop/use-animation-frame/blob/master/src/index.js
See also:
  - https://css-tricks.com/using-requestanimationframe-with-react-hooks
*/
export type UseAnimationFrameCallback = (info: { time: number, delta: number }) => void;
export const useAnimationFrame = (cb: null | UseAnimationFrameCallback) => {
  if (typeof performance === 'undefined' || typeof window === 'undefined') {
    return;
  }
  
  const cbRef = React.useRef<null | UseAnimationFrameCallback>(cb);
  const rafHandle = React.useRef<null | number>(null);
  const init = React.useRef<number>(performance.now());
  const last = React.useRef<number>(performance.now());
  
  cbRef.current = cb;
  
  const animate = (now: number) => {
    const cb = cbRef.current;
    if (cb === null) { return; }
    cb({
      time: now - init.current, // ms
      delta: now - last.current, // ms
    });
    last.current = now;
    rafHandle.current = window.requestAnimationFrame(animate);
  };
  
  React.useLayoutEffect(() => {
    if (cb === null) { return; } // If no callback was passed yet, wait to start the animation
    
    rafHandle.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafHandle.current) {
        window.cancelAnimationFrame(rafHandle.current);
      }
    };
  }, [cb === null]);
};
