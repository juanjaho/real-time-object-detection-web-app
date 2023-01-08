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
  const [facingMode, setFacingMode] = useState<string>("environment");

  const originalSize = useRef<number[]>([0, 0]);

  useEffect(() => {
    const getSession = async () => {
      const session = await runModelUtils.createModelCpu(props.modelUri);
      setSession(session);
    };
    getSession();
  }, [props.modelUri]);

  const capture = () => {
    const canvas = videoCanvasRef.current!;
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    if (facingMode === "user") {
      context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    }

    context.drawImage(
      webcamRef.current!.video!,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    if (facingMode === "user") {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    return context;
  };

  const runModel = async (ctx: CanvasRenderingContext2D) => {
    const totalStartTime = performance.now();

    const data = props.preprocess(ctx);
    let outputTensor: Tensor;
    let inferenceTime: number;
    [outputTensor, inferenceTime] = await runModelUtils.runModel(session, data);

    props.postprocess(outputTensor, props.inferenceTime, ctx);
    const totalEndTime = performance.now();
    setInferenceTime(inferenceTime);
    setTotalTime(totalEndTime - totalStartTime);
  };

  const runLiveDetection = async () => {
    if (liveDetection.current) {
      liveDetection.current = false;
      return;
    }
    liveDetection.current = true;
    while (liveDetection.current) {
      const ctx = capture();
      if (!ctx) return;
      await runModel(ctx);
      // props.resizeCanvasCtx(ctx, originalSize.current[0], originalSize.current[1]);
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
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    boxCtx.canvas.width = ctx.canvas.width;
    boxCtx.canvas.height = ctx.canvas.height;
    boxCtx.drawImage(ctx.canvas, 0, 0);

    await runModel(boxCtx);
    ctx.drawImage(boxCtx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const reset = async () => {
    var context = videoCanvasRef.current!.getContext("2d")!;
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

  useEffect(() => {
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.onloadedmetadata = () => {
        setWebcamCanvasOverlaySize();
        originalSize.current = [
          webcamRef.current!.video!.offsetWidth,
          webcamRef.current!.video!.offsetHeight,
        ] as number[];
      };
    }
  }, [webcamRef.current?.video]);

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
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  
  
  if (SSR) {
    return <div>Loading...</div>;
  }
  // resize_canvas();
  return (
    <div className="flex flex-row flex-wrap  justify-evenly align-center w-full">
      <div
        id="webcam-container"
        className="flex items-center justify-center webcam-container"
      >
        <Webcam
          mirrored={facingMode === "user"}
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          imageSmoothing={true}
          videoConstraints={{
            facingMode: facingMode,
            // width: props.width,
            // height: props.height,
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
      <div className="flex flex-col justify-center items-center">
        <div className="flex gap-1 flex-row flex-wrap justify-center items-center m-5">
          <div className="flex gap-1 justify-center items-center items-stretch">
            <button
              onClick={() => {
                processImage();
              }}
              //on hover, shift the button up
              className="p-2 border-dashed border-2 rounded-xl hover:translate-y-1 "
            >
              Capture Photo
            </button>
            <button
              onClick={() => {
                if (liveDetection.current) {
                  liveDetection.current = false;
                  // reset();
                } else {
                  runLiveDetection();
                }
              }}
              //on hover, shift the button up
              className={`
              p-2  border-dashed border-2 rounded-xl hover:translate-y-1 
              ${liveDetection.current ? "bg-white text-black" : ""}
              
              `}
            >
              Live Detection
            </button>
          </div>
          <div className="flex gap-1 justify-center items-center items-stretch">
            <button
              onClick={() => {
                setFacingMode(facingMode === "user" ? "environment" : "user");
              }}
              className="p-2  border-dashed border-2 rounded-xl hover:translate-y-1 "
            >
              Switch Camera
            </button>
            <button
              onClick={reset}
              className="p-2  border-dashed border-2 rounded-xl hover:translate-y-1 "
            >
              Reset
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-row flex-wrap justify-between items-center px-5 w-full">
          <div>
            {"Model Inference Time: " + inferenceTime + "ms"}
            <br />
            {"Total Time: " + totalTime.toFixed() + "ms"}
            <br />
            {"Overhead Time: +" + (totalTime - inferenceTime).toFixed(2) + "ms"}
          </div>
          <div>
            <div>
              {"Model FPS: " + (1000 / inferenceTime).toFixed(2) + "fps"}
            </div>
            <div>{"Total FPS: " + (1000 / totalTime).toFixed(2) + "fps"}</div>
            <div>
              {"Overhead FPS: " +
                (1000 * (1 / totalTime - 1 / inferenceTime)).toFixed(2) +
                "fps"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamComponent;
