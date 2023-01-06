import Webcam from "react-webcam";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { imageHelper, predict, runModelUtils } from "../utils";
import { Tensor } from "onnxruntime-web";
import Canvas from "./Canvas";

const WebcamComponent = (props: any) => {
  let inferenceTime = 0;
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [camera, setCamera] = useState<string>('user');

  useEffect(() => {
    if (liveStream) {
      const interval = setInterval(() => {
        capture();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [liveStream]);

  //get session from  /models/Yolov7-tiny.onnx
  useEffect(() => {
    const getSession = async () => {
      console.log(props.modelUri);
      const session = await runModelUtils.createModelCpuFromUrl(props.modelUri);
      setSession(session);
    };
    getSession();
  }, [props.modelUri]);

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      // const imageSrc = "/car.jpg";
      setImgSrc(imageSrc);
    } else {
      console.log("webcamRef.current is null");
    }
  };

  const runModel = async (ctx: CanvasRenderingContext2D) => {
    const data = props.preprocess(ctx);
    console.log(data);
    let outputTensor: Tensor;
    [outputTensor, inferenceTime] = await runModelUtils.runModel(session, data);
    console.log(outputTensor);
    console.log(inferenceTime);

    props.postprocess(outputTensor, props.inferenceTime, ctx);
  };

  const processImage = async () => {
    if (canvasRef) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      runModel(ctx);
    }
  };

  const clear = () => {
    setImgSrc(null);
    setLiveStream(false);
  };

  const [SSR, setSSR] = useState<Boolean>(true);

  useEffect(() => {
    setSSR(false);
  }, []);

  if (SSR) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <div className="flex items-center justify-center">
        <Webcam
          width={props.width}
          height={props.height}
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          imageSmoothing={true}
          videoConstraints={{
            facingMode: "user",
          }}
        />
       
      </div>
      <div className="flex flex-row">
        <button
          onClick={() => {
            capture();
          }}
          //on hover, shift the button up
          className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Capture photo
        </button>
        <button
          onClick={() => {
            setLiveStream(!liveStream);
          }}
          //on hover, shift the button up
          className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Start Live Detection
        </button>
        <button
          onClick={() => {
            setCamera(camera === 'user' ? 'environment' : 'user');
          }}
          //on hover, shift the button up
          className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Switch camera
        </button>
        <button
          onClick={clear}
          className="p-2 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Clear
        </button>
      </div>
        <Canvas
          ref={canvasRef}
          width={props.width}
          height={props.height}
          imageSrc={imgSrc}
          processImage={processImage}
        />
    </>
  );
};

export default WebcamComponent;
