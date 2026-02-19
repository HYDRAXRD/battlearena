import React from 'react';
import { PIXEL_PALETTE } from '@/game/constants';

interface Props {
  art: string[];
  pixelSize?: number;
  className?: string;
}

const PixelCanvas: React.FC<Props> = ({ art, pixelSize = 4, className = '' }) => {
  const h = art.length;
  const w = Math.max(...art.map(r => r.length));
  return (
    <svg width={w * pixelSize} height={h * pixelSize} className={className} style={{ imageRendering: 'pixelated' }}>
      {art.map((row, y) =>
        row.split('').map((ch, x) => {
          const color = PIXEL_PALETTE[ch];
          return color ? (
            <rect key={`${x}-${y}`} x={x * pixelSize} y={y * pixelSize} width={pixelSize} height={pixelSize} fill={color} />
          ) : null;
        })
      )}
    </svg>
  );
};

export default PixelCanvas;
