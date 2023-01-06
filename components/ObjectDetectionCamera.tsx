import Webcam from "react-webcam";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { runModelUtils } from "../utils";
import { Tensor } from "onnxruntime-web";

const WebcamComponent = (props: any) => {
  let inferenceTime = 0;
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveStream= useRef<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<string>("user");
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [sessionRunning, setSessionRunning] = useState<boolean>(false);

  useEffect(() => {
    const getSession = async () => {
      console.log(props.modelUri);
      const session = await runModelUtils.createModelCpuFromUrl(props.modelUri);
      setSession(session);
      if (webcamRef.current && webcamRef.current.video) {
        setVideoWidth(webcamRef.current.video.videoWidth);
        setVideoHeight(webcamRef.current.video.videoHeight);
      }
    };
    getSession();
  }, [props.modelUri]);

  const capture = () => {
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
    const context = canvas.getContext("2d",{ willReadFrequently: true }) as CanvasRenderingContext2D;
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
    const videoCanvasCtx = videoCanvasRef.current?.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    videoCanvasCtx.clearRect(0, 0, 640, 640);
    props.postprocess(outputTensor, props.inferenceTime, videoCanvasCtx);
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
    runModel(ctx);
    
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
    console.log("passsed");
    console.log(webcamRef.current?.video);
    const element = webcamRef.current?.video as HTMLVideoElement;
    console.log(element);
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
    // resize_canvas();
  }, []);

  if (SSR) {
    
    return <div>Loading...</div>;
  }
  // resize_canvas();
  return (
    <>
      <div
        id="webcam-container"
        className="flex items-center justify-center webcam-container"
        style={{
          // position: "relative",
          width: props.width,
          height: props.height,
        }}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          // onLoadStart={() => {
          //   resize_canvas();
          //   console.log("loaded");
          // }}
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
            liveStream.current = true
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
