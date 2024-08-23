import Webcam from 'react-webcam';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { runModelUtils } from '../utils';
import { InferenceSession, Tensor } from 'onnxruntime-web';

const ObjectDetectionCamera = (props: {
  width: number;
  height: number;
  modelName: string;
  session: InferenceSession;
  preprocess: (ctx: CanvasRenderingContext2D) => Tensor;
  postprocess: (
    outputTensor: Tensor,
    inferenceTime: number,
    ctx: CanvasRenderingContext2D,
    modelName: string
  ) => void;
  currentModelResolution: number[];
  changeCurrentModelResolution: (width?: number, height?: number) => void;
}) => {
  const [inferenceTime, setInferenceTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const webcamRef = useRef<Webcam>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveDetection = useRef<boolean>(false);

  const [facingMode, setFacingMode] = useState<string>('environment');
  const originalSize = useRef<number[]>([0, 0]);

  const [modelResolution, setModelResolution] = useState<number[]>(
    props.currentModelResolution
  );

  useEffect(() => {
    setModelResolution(props.currentModelResolution);
  }, [props.currentModelResolution]);

  const capture = () => {
    const canvas = videoCanvasRef.current!;
    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    })!;

    if (facingMode === 'user') {
      context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    }

    context.drawImage(
      webcamRef.current!.video!,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (facingMode === 'user') {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    return context;
  };

  const runModel = async (ctx: CanvasRenderingContext2D) => {
    const data = props.preprocess(ctx);
    let outputTensor: Tensor;
    let inferenceTime: number;
    [outputTensor, inferenceTime] = await runModelUtils.runModel(
      props.session,
      data
    );

    props.postprocess(outputTensor, inferenceTime, ctx, props.modelName);
    setInferenceTime(inferenceTime);
  };

  const runLiveDetection = async () => {
    if (liveDetection.current) {
      liveDetection.current = false;
      return;
    }
    liveDetection.current = true;
    while (liveDetection.current) {
      const startTime = Date.now();
      const ctx = capture();
      if (!ctx) return;
      await runModel(ctx);
      setTotalTime(Date.now() - startTime);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
    }
  };

  const processImage = async () => {
    reset();
    const ctx = capture();
    if (!ctx) return;

    // create a copy of the canvas
    const boxCtx = document
      .createElement('canvas')
      .getContext('2d') as CanvasRenderingContext2D;
    boxCtx.canvas.width = ctx.canvas.width;
    boxCtx.canvas.height = ctx.canvas.height;
    boxCtx.drawImage(ctx.canvas, 0, 0);

    await runModel(boxCtx);
    ctx.drawImage(boxCtx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const reset = async () => {
    var context = videoCanvasRef.current!.getContext('2d')!;
    context.clearRect(0, 0, originalSize.current[0], originalSize.current[1]);
    liveDetection.current = false;
  };

  const [SSR, setSSR] = useState<Boolean>(true);

  const setWebcamCanvasOverlaySize = () => {
    const element = webcamRef.current!.video!;
    if (!element) return;
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var cv = videoCanvasRef.current;
    if (!cv) return;
    cv.width = w;
    cv.height = h;
  };

  // close camera when browser tab is minimized
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        liveDetection.current = false;
      }
      // set SSR to true to prevent webcam from loading when tab is not active
      setSSR(document.hidden);
    };
    setSSR(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (SSR) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-row flex-wrap w-full justify-evenly align-center">
      <div
        id="webcam-container"
        className="flex items-center justify-center webcam-container"
      >
        <Webcam
          mirrored={facingMode === 'user'}
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          imageSmoothing={true}
          videoConstraints={{
            facingMode: facingMode,
            // width: props.width,
            // height: props.height,
          }}
          onLoadedMetadata={() => {
            setWebcamCanvasOverlaySize();
            originalSize.current = [
              webcamRef.current!.video!.offsetWidth,
              webcamRef.current!.video!.offsetHeight,
            ] as number[];
          }}
          forceScreenshotSourceSize={true}
        />
        <canvas
          id="cv1"
          ref={videoCanvasRef}
          style={{
            position: 'absolute',
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0)',
          }}
        ></canvas>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-row flex-wrap items-center justify-center gap-1 m-5">
          <div className="flex items-stretch items-center justify-center gap-1">
            <button
              onClick={async () => {
                const startTime = Date.now();
                await processImage();
                setTotalTime(Date.now() - startTime);
              }}
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1 "
            >
              Capture Photo
            </button>
            <button
              onClick={async () => {
                if (liveDetection.current) {
                  liveDetection.current = false;
                } else {
                  runLiveDetection();
                }
              }}
              //on hover, shift the button up
              className={`
              p-2  border-dashed border-2 rounded-xl hover:translate-y-1 
              ${liveDetection.current ? 'bg-white text-black' : ''}
              
              `}
            >
              Live Detection
            </button>
          </div>
          <div className="flex items-stretch items-center justify-center gap-1">
            <button
              onClick={() => {
                reset();
                setFacingMode(facingMode === 'user' ? 'environment' : 'user');
              }}
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1 "
            >
              Switch Camera
            </button>
            <button
              onClick={() => {
                reset();
                props.changeCurrentModelResolution();
              }}
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1 "
            >
              Change Model
            </button>
            <button
              onClick={reset}
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1 "
            >
              Reset
            </button>
          </div>
        </div>
        {/* <div>
          <div>Yolov10 has a dynamic resolution with a maximum of 640x640</div>
          <div className="flex items-stretch items-center justify-center gap-1">
            <input
              value={modelResolution[0]}
              max={640}
              type="number"
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1"
              placeholder="Width"
              onChange={(e) => {
                setModelResolution([
                  parseInt(e.target.value),
                  modelResolution[1],
                ]);
              }}
            />
            <input
              value={modelResolution[1]}
              max={640}
              type="number"
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1"
              placeholder="Height"
              onChange={(e) => {
                setModelResolution([
                  modelResolution[0],
                  parseInt(e.target.value),
                ]);
              }}
            />
            <button
              onClick={() => {
                reset();
                if (modelResolution[0] > 640 || modelResolution[1] > 640) {
                  alert('Maximum resolution is 640x640');
                  return;
                }
                props.changeCurrentModelResolution(
                  modelResolution[0],
                  modelResolution[1]
                );
              }}
              className="p-2 border-2 border-dashed rounded-xl hover:translate-y-1"
            >
              Apply
            </button>
          </div>
        </div> */}
        <div>Using {props.modelName}</div>
        <div className="flex flex-row flex-wrap items-center justify-between w-full gap-3 px-5">
          <div>
            {'Model Inference Time: ' + inferenceTime.toFixed() + 'ms'}
            <br />
            {'Total Time: ' + totalTime.toFixed() + 'ms'}
            <br />
            {'Overhead Time: +' + (totalTime - inferenceTime).toFixed(2) + 'ms'}
          </div>
          <div>
            <div>
              {'Model FPS: ' + (1000 / inferenceTime).toFixed(2) + 'fps'}
            </div>
            <div>{'Total FPS: ' + (1000 / totalTime).toFixed(2) + 'fps'}</div>
            <div>
              {'Overhead FPS: ' +
                (1000 * (1 / totalTime - 1 / inferenceTime)).toFixed(2) +
                'fps'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetectionCamera;
