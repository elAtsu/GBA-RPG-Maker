'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface SpritePreviewProps {
  dataUrl: string;
  height: number;
}

export function SpritePreview({ dataUrl, height }: SpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      const image = new Image();
      image.onload = () => {
        setImageSize({ width: image.width, height: image.height });
        // Set canvas dimensions to the actual image size to avoid distortion
        canvas.width = image.width;
        canvas.height = image.height;

        // Clear canvas and draw the image
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0);
        setIsLoading(false);
      };
      image.onerror = () => {
        setIsLoading(false);
        console.error("Failed to load image for preview.");
      }
      image.src = dataUrl;
    }
  }, [dataUrl, height]);

  return (
    <div className="my-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
      {isLoading && <Skeleton className="h-20 w-full" />}
      <Card 
        className="p-2 bg-background/70 flex justify-center items-center"
        style={{ 
          display: isLoading ? 'none' : 'flex',
          // Ensure the card can contain the full image if it's large
          maxHeight: imageSize.height > 160 ? `${imageSize.height}px` : '160px',
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="mx-auto" 
          style={{ 
            imageRendering: 'pixelated', 
            maxWidth: '100%', 
            // Control the display size of the canvas, not its drawing surface size
            height: height > imageSize.height ? `${imageSize.height}px` : `${height}px`,
            width: 'auto'
          }}
        />
      </Card>
    </div>
  );
}
