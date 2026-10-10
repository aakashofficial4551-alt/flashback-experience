import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/motion.js';

// Full-screen film grain. A tiny canvas is redrawn ~12x/second and scaled up by
// CSS, which is cheap on mobile. Reduced-motion users get a single still frame.
const SIZE = 160;
const FRAME_MS = 80;

export default function Grain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const c = canvas.getContext('2d');
    const img = c.createImageData(SIZE, SIZE);
    let raf = 0, last = 0;

    const draw = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    };
    const loop = (t) => {
      if (t - last > FRAME_MS) { last = t; draw(); }
      raf = requestAnimationFrame(loop);
    };

    draw();
    if (!prefersReducedMotion()) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="grain" width={SIZE} height={SIZE} aria-hidden="true" />;
}
