import React, { useRef, useEffect, forwardRef } from "react";

type CanvasProps = {
  width: number;
  height: number;
  imageSrc: string | null;
  processImage?: (ctx: CanvasRenderingContext2D) => void;
};

const Canvas = forwardRef(
  ({ width, height, imageSrc, processImage }: CanvasProps, ref?: any) => {
    var canvasRef = useRef<HTMLCanvasElement>(null);
    if (ref) {
      canvasRef = ref;
    }

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      // Set the canvas size to the specified width and height
      canvas.width = width;
      canvas.height = height;

      // Load the image and draw it on the canvas
      if (!imageSrc) return;
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        context.drawImage(image, 0, 0);
        if (processImage) processImage(context);
      };

      // Draw a rectangle on the canvas
      // context.strokeStyle = "red";
      // context.lineWidth = 5;
      // context.strokeRect(50, 50, 100, 100);
    }, [width, height, imageSrc]);

    return <canvas ref={canvasRef} />;
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
