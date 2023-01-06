import Webcam from "react-webcam";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { runModelUtils } from "../utils";
import { Tensor } from "onnxruntime-web";

const WebcamComponent = (props: any) => {
  let inferenceTime = 0;
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveStream = useRef<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<string>("user");

  useEffect(() => {
    const getSession = async () => {
      console.log(props.modelUri);
      const session = await runModelUtils.createModelCpuFromUrl(props.modelUri);
      setSession(session);
    };
    getSession();
  }, [props.modelUri]);

  const capture = () => {
    const [videoWidth, videoHeight] = [
      webcamRef.current?.video?.offsetWidth,
      webcamRef.current?.video?.offsetHeight,
    ] as number[];
    console.log(videoWidth, videoHeight);
    const size = Math.min(videoWidth, videoHeight);
    const centerHeight = videoHeight / 2;
    const beginHeight = centerHeight - size / 2;
    const centerWidth = videoWidth / 2;
    const beginWidth = centerWidth - size / 2;

    console.log(videoWidth, videoHeight);
    // placeholder to draw a image
    if (!videoCanvasRef.current) return;
    const canvas = videoCanvasRef.current;
    canvas.width = Math.min(videoWidth, videoHeight);
    canvas.height = Math.min(videoWidth, videoHeight);
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    context.drawImage(
      webcamRef.current?.video as HTMLVideoElement,
      beginWidth,
      beginHeight,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return context;
  };

  const runModel = async (ctx: CanvasRenderingContext2D) => {
    const data = props.preprocess(ctx);
    console.log(data);
    let outputTensor: Tensor;
    [outputTensor, inferenceTime] = await runModelUtils.runModel(session, data);
    console.log(outputTensor);
    console.log(inferenceTime);
    ctx.clearRect(0, 0, 640, 640);
    props.postprocess(outputTensor, props.inferenceTime, ctx);
  };

  const runLiveSteam = async () => {
    while (liveStream.current) {
      const ctx = capture();
      if (!ctx) return;
      await runModel(ctx);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
    }
  };
  useEffect(() => {
    runLiveSteam();
  }, [liveStream.current]);

  const processImage = async () => {
    const ctx = capture();
    if (!ctx) return;

    // create a copy of the canvas
    const copyCtx = document
      .createElement("canvas")
      .getContext("2d") as CanvasRenderingContext2D;
    copyCtx.canvas.width = 640;
    copyCtx.canvas.height = 640;
    copyCtx.drawImage(ctx.canvas, 0, 0);
    await runModel(copyCtx);
    ctx.drawImage(copyCtx.canvas, 0, 0);
  };

  const reset = async () => {
    var context = videoCanvasRef.current?.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    context.clearRect(0, 0, 640, 640);
    liveStream.current = false;
    console.log(liveStream);
  };

  const [SSR, setSSR] = useState<Boolean>(true);

  const resize_canvas = () => {
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

  // useLayoutEffect(() => {
  //   resize_canvas();
  // }, [webcamRef.current?.video]);

  useEffect(() => {
    setSSR(false);
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.onloadedmetadata = () => {
        resize_canvas();
      };
    }
  });

  if (SSR) {
    return <div>Loading...</div>;
  }
  // resize_canvas();
  return (
    <>
      <div
        id="webcam-container"
        className="flex items-center justify-center webcam-container"
        style={
          {
            // position: "relative",
            // width: props.width,
            // height: props.height,
          }
        }
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
            // top: 0,
            // left: 0,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0)",
          }}
        ></canvas>
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
          Capture photo
        </button>
        <button
          onClick={() => {
            liveStream.current = true;
            runLiveSteam();
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
          Switch camera
        </button>
        <button
          onClick={reset}
          className="p-2 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Reset
        </button>
      </div>
      {/* <canvas ref={canvasRef} width={props.width} height={props.height} /> */}
      {/* <Canvas
          ref={canvasRef}
          width={props.width}
          height={props.height}
          imageSrc={imgSrc}
          processImage={processImage}
        /> */}
    </>
  );
};

export default WebcamComponent;
