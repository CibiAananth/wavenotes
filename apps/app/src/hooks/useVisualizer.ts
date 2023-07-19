import { useRef, useState } from 'react';

export function useVisualizer() {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));

  const canvasRef = useRef<HTMLCanvasElement>(null);

  (() => {
    if (!canvasRef.current) return false;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d') as CanvasRenderingContext2D;
    const width = canvas?.width as number;
    const height = canvas?.height as number;
    context.clearRect(0, 0, width, height);

    let x = 0;
    const sliceWidth = (width * 1.0) / audioData.length;

    context.lineWidth = 2;
    context.strokeStyle = '#000000';

    context.beginPath();
    context.moveTo(0, height / 2);

    for (const item of audioData) {
      const y = (item / 255.0) * height;
      context.lineTo(x, y);
      x += sliceWidth;
    }
    context.lineTo(x, height / 2);
    context.stroke();
  })();

  return { canvasRef, setAudioData };
}
