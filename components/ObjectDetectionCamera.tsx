import Webcam from "react-webcam";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { runModelUtils } from "../utils";
import { Tensor } from "onnxruntime-web";

const WebcamComponent = (props: any) => {
  const [inferenceTime, setInferenceTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const webcamRef = useRef<Webcam>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveDetection = useRef<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<string>("user");

  const originalSize = useRef<number[]>([0, 0]);

  useEffect(() => {
    const getSession = async () => {
      console.log(props.modelUri);
      const session = await runModelUtils.createModelCpu(props.modelUri);
      setSession(session);
    };
    getSession();
  }, [props.modelUri]);

  const resizeCanvasCtx = (
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number
  ) => {
    const ctxCopy = document
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    ctxCopy.canvas.width = ctx.canvas.width;
    ctxCopy.canvas.height = ctx.canvas.height;
    ctxCopy.drawImage(ctx.canvas, 0, 0);

    ctx.canvas.width = targetWidth;
    ctx.canvas.height = targetHeight;
    ctx.drawImage(ctxCopy.canvas, 0, 0, targetWidth, targetHeight);
  };

  const capture = () => {
    // const [videoWidth, videoHeight] = [
    //   originalSize.current[0],
    //   originalSize.current[1],
    // ] as number[];

    // placeholder to draw a image
    if (!videoCanvasRef.current) return;
    const canvas = videoCanvasRef.current;
    // canvas.width = Math.min(videoWidth, videoHeight);
    // canvas.height = Math.min(videoWidth, videoHeight);
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    context.drawImage(
      webcamRef.current?.video as HTMLVideoElement,
      // beginWidth,
      // beginHeight,
      // size,
      // size,
      0,
      0,
      // canvas.width,
      // canvas.height
    );
    console.log(context.canvas.width, context.canvas.height);
    return context;
  };

  const runModel = async (ctx: CanvasRenderingContext2D) => {
    const totalStartTime = performance.now();
    console.log(ctx.canvas.width, ctx.canvas.height);
    const data = props.preprocess(ctx);
    let outputTensor: Tensor;
    let inferenceTime: number;
    [outputTensor, inferenceTime] = await runModelUtils.runModel(session, data);
    console.log(outputTensor);
    console.log(inferenceTime);
    setInferenceTime(inferenceTime);
    ctx.clearRect(0, 0, originalSize.current[0], originalSize.current[1]);
    props.postprocess(outputTensor, props.inferenceTime, ctx);
    // resizeCanvasCtx(ctx, originalSize.current[0], originalSize.current[1]);
    const totalEndTime = performance.now();
    setTotalTime(totalEndTime - totalStartTime);
  };

  const runLiveDetection = async () => {
    while (liveDetection.current) {
      const ctx = capture();
      console.log(ctx?.canvas.width, ctx?.canvas.height);
      if (!ctx) return;
      await runModel(ctx);
      resizeCanvasCtx(ctx, originalSize.current[0], originalSize.current[1]);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
    }
  };

  const processImage = async () => {
    const ctx = capture();
    if (!ctx) return;

    // create a copy of the canvas
    const boxCtx = document
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    boxCtx.canvas.width = ctx.canvas.width;
    boxCtx.canvas.height = ctx.canvas.height;
    boxCtx.drawImage(ctx.canvas, 0, 0);
    await runModel(boxCtx);
    ctx.drawImage(boxCtx.canvas, 0, 0);

    props.resizeCanvasCtx(ctx, originalSize.current[0], originalSize.current[1]);

    // const imageCtx = document
    //   .createElement("canvas")
    //   .getContext("2d") as CanvasRenderingContext2D;
    // imageCtx.canvas.width = ctx.canvas.width;
    // imageCtx.canvas.height = ctx.canvas.height;
    // imageCtx.drawImage(ctx.canvas, 0, 0);

    // ctx.canvas.width = originalSize.current[0];
    // ctx.canvas.height = originalSize.current[1];
    // ctx.drawImage(
    //   imageCtx.canvas,
    //   0,
    //   0,
    //   originalSize.current[0],
    //   originalSize.current[1]
    // );
    // ctx.drawImage(
    //   boxCtx.canvas,
    //   0,
    //   0,
    //   originalSize.current[0],
    //   originalSize.current[1]
    // );
  };

  const reset = async () => {
    var context = videoCanvasRef.current?.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    context.clearRect(0, 0, originalSize.current[0], originalSize.current[1]);
    liveDetection.current = false;
    console.log(liveDetection);
  };

  const [SSR, setSSR] = useState<Boolean>(true);

  const setWebcamCanvasOverlaySize = () => {
    const element = webcamRef.current?.video as HTMLVideoElement;
    console.log(element.offsetHeight, element.offsetWidth);
    if (!element) return;
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var cv = videoCanvasRef.current as HTMLCanvasElement;
    if (!cv) return;
    cv.width = w;
    cv.height = h;
  };

  useEffect(() => {
    setSSR(false);
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.onloadedmetadata = () => {
        setWebcamCanvasOverlaySize();
        originalSize.current = [
          webcamRef.current?.video?.offsetWidth,
          webcamRef.current?.video?.offsetHeight,
        ] as number[];
        // console.log(originalSize.current);
      };
    }
  }, [webcamRef.current?.video]);

  if (SSR) {
    return <div>Loading...</div>;
  }
  // resize_canvas();
  return (
    <>
      <div
        id="webcam-container"
        className="flex items-center justify-center webcam-container"
      >
        <Webcam
          // mirrored={false}
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          imageSmoothing={true}
          videoConstraints={{
            facingMode: facingMode,
            width: props.width,
            height: props.height,
          }}
          forceScreenshotSourceSize={true}
        />
        <canvas
          id="cv1"
          ref={videoCanvasRef}
          style={{
            position: "absolute",
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0)",
          }}
        ></canvas>
      </div>
      <div>
        <div className="flex justify-between ">
          <div>
            {"Model Inference Time: " + inferenceTime + "ms"}
            <br />
            {"Total Time: " + totalTime + "ms"}
            <br />
            {"Overhead: " + (totalTime - inferenceTime).toFixed(2) + "ms"}
          </div>
          <div>
            <div>
              {"Model FPS: " + (1000 / inferenceTime).toFixed(2) + "fps"}
            </div>
            <div>{"Total FPS: " + (1000 / totalTime).toFixed(2) + "fps"}</div>
            <div>
              {"FPS lost to overhead: " +
                (1000 * (1 / inferenceTime - 1 / totalTime)).toFixed(2) +
                "fps"}
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-center">
          <button
            onClick={() => {
              capture();
              processImage();
            }}
            //on hover, shift the button up
            className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
          >
            Capture Photo
          </button>
          <button
            onClick={() => {
              liveDetection.current = true;
              runLiveDetection();
            }}
            //on hover, shift the button up
            className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
          >
            Start Live Detection
          </button>
          <button
            onClick={() => {
              setFacingMode(facingMode === "user" ? "environment" : "user");
            }}
            //on hover, shift the button up
            className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
          >
            Switch Camera
          </button>
          <button
            onClick={reset}
            className="p-2 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
};

export default WebcamComponent;
