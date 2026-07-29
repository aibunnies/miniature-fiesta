import { useEffect, useRef } from 'react';

/**
 * GradientBlinds — animated vertical gradient blinds with mouse parallax,
 * spotlight, noise, and shine sweep effects.
 *
 * Renders a full-bleed canvas that fills its positioned parent.
 */
export default function GradientBlinds({
  gradientColors = ['#FF9FFC', '#5227FF'],
  angle = 0,
  noise = 0.3,
  blindCount = 16,
  blindMinWidth = 60,
  mouseDampening = 0.15,
  mirrorGradient = false,
  spotlightRadius = 0.5,
  spotlightSoftness = 1,
  spotlightOpacity = 1,
  distortAmount = 0,
  shineDirection = 'left'
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({
    mouse: { x: 0.5, y: 0.5 },
    targetMouse: { x: 0.5, y: 0.5 },
    shine: 0,
    animId: null
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function onMouseMove(e) {
      const rect = container.getBoundingClientRect();
      state.targetMouse = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    }

    function onTouchMove(e) {
      if (e.touches && e.touches[0]) {
        const rect = container.getBoundingClientRect();
        state.targetMouse = {
          x: (e.touches[0].clientX - rect.left) / rect.width,
          y: (e.touches[0].clientY - rect.top) / rect.height
        };
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // Pre-generate noise texture
    const noiseSize = 128;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = noiseSize;
    noiseCanvas.height = noiseSize;
    const noiseCtx = noiseCanvas.getContext('2d');
    const noiseData = noiseCtx.createImageData(noiseSize, noiseSize);
    for (let i = 0; i < noiseData.data.length; i += 4) {
      const v = Math.random() * 255;
      noiseData.data[i] = v;
      noiseData.data[i + 1] = v;
      noiseData.data[i + 2] = v;
      noiseData.data[i + 3] = 255;
    }
    noiseCtx.putImageData(noiseData, 0, 0);

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    }

    const rgbColors = gradientColors.map(hexToRgb);

    function getColor(t) {
      let tt = t;
      if (mirrorGradient) {
        tt = t < 0.5 ? t * 2 : (1 - t) * 2;
      }
      tt = Math.max(0, Math.min(1, tt));
      const idx = tt * (rgbColors.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, rgbColors.length - 1);
      const localT = idx - i0;
      return {
        r: Math.round(lerp(rgbColors[i0].r, rgbColors[i1].r, localT)),
        g: Math.round(lerp(rgbColors[i0].g, rgbColors[i1].g, localT)),
        b: Math.round(lerp(rgbColors[i0].b, rgbColors[i1].b, localT))
      };
    }

    function render() {
      state.animId = requestAnimationFrame(render);
      if (width === 0 || height === 0) return;

      // Smooth mouse
      state.mouse.x = lerp(state.mouse.x, state.targetMouse.x, mouseDampening);
      state.mouse.y = lerp(state.mouse.y, state.targetMouse.y, mouseDampening);

      const mx = state.mouse.x;
      const my = state.mouse.y;

      ctx.clearRect(0, 0, width, height);

      // Calculate blind dimensions
      const blindWidth = Math.max(blindMinWidth, width / blindCount);
      const totalBlinds = Math.ceil(width / blindWidth) + 2;
      const angleRad = (angle * Math.PI) / 180;

      // Draw blinds
      for (let i = -1; i < totalBlinds; i++) {
        const t = (i + 1) / totalBlinds;

        // Parallax: blinds near center move less, edges move more
        const depthFactor = Math.abs(t - 0.5) * 2;
        const parallax = (mx - 0.5) * depthFactor * 80 * (1 + distortAmount * 3);

        // Wave distortion
        const distort = Math.sin(t * Math.PI * 3 + state.shine * 2) * distortAmount * 30;

        const x = i * blindWidth + parallax + distort;
        const color = getColor(t);

        // Draw blind strip with slight gap
        const gap = 1;
        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;

        // Apply angle via skew transform
        if (angle !== 0) {
          ctx.save();
          const cx = x + blindWidth / 2;
          const cy = height / 2;
          ctx.translate(cx, cy);
          ctx.rotate(angleRad);
          ctx.translate(-cx, -cy);
          ctx.fillRect(x + gap / 2, -height, blindWidth - gap, height * 3);
          ctx.restore();
        } else {
          ctx.fillRect(x + gap / 2, 0, blindWidth - gap, height);
        }
      }

      // Spotlight effect
      const sx = mx * width;
      const sy = my * height;
      const sr = spotlightRadius * Math.max(width, height);

      const spotGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      spotGradient.addColorStop(0, `rgba(255,255,255,${spotlightOpacity * 0.5})`);
      spotGradient.addColorStop(0.4 / Math.max(spotlightSoftness, 0.01), `rgba(255,255,255,${spotlightOpacity * 0.15})`);
      spotGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spotGradient;
      ctx.fillRect(0, 0, width, height);

      // Noise overlay
      if (noise > 0) {
        ctx.globalAlpha = noise;
        ctx.globalCompositeOperation = 'overlay';
        const noisePattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (noisePattern) {
          ctx.fillStyle = noisePattern;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Shine sweep
      state.shine += 0.003;
      const shineProgress = state.shine % 1;
      const shineX =
        shineDirection === 'left'
          ? (1 - shineProgress) * (width * 1.5) - width * 0.25
          : shineProgress * (width * 1.5) - width * 0.25;

      const shineW = width * 0.25;
      const shineGradient = ctx.createLinearGradient(shineX - shineW, 0, shineX + shineW, 0);
      shineGradient.addColorStop(0, 'rgba(255,255,255,0)');
      shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shineGradient;
      ctx.fillRect(0, 0, width, height);
    }

    render();

    return () => {
      cancelAnimationFrame(state.animId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, [
    gradientColors,
    angle,
    noise,
    blindCount,
    blindMinWidth,
    mouseDampening,
    mirrorGradient,
    spotlightRadius,
    spotlightSoftness,
    spotlightOpacity,
    distortAmount,
    shineDirection
  ]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}