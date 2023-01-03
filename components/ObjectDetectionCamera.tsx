import Webcam from "react-webcam";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

const WebcamComponent = (props: any) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    } else {
      console.log("webcamRef.current is null");
    }
  };

  //stream video and process it with pytorch model
  const processVideo = () => {
    if (webcamRef.current) {
      const canvas = webcamRef.current.getCanvas();
      console.log(canvas);

      //draw bounding boxes
      if (canvas) {
        const ctx = canvas.getContext("2d");

        
        if (ctx) {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 3;
          //write text
          ctx.font = "30px Arial";
          ctx.fillStyle = "red";
          ctx.fillText("Hello World", 100, 100);

          ctx.beginPath();
          ctx.rect(100, 100, 150, 100);
          ctx.stroke();

          //set the new image source
          setImgSrc(canvas.toDataURL("image/jpeg"));

        }
      }
    }
    // requestAnimationFrame(processVideo);
  };
  // processVideo();
  const clear = () => {
    setImgSrc(null);
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
      <Webcam
        width={props.width}
        height={props.height}
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        imageSmoothing={true}
      />
      <div>
        <button
          onClick={() => {
            capture();
            processVideo();
          }}
          //on hover, shift the button up
          className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Capture photo
        </button>
        <button
          onClick={clear}
          className="p-2 my-5 border-dashed border-2 rounded-xl hover:translate-y-1 active:translate-y-1"
        >
          Clear
        </button>
      </div>
      {imgSrc && (
        <Image
          src={imgSrc}
          alt="Picture taken"
          width={props.width}
          height={props.height}
        />
      )}
    </>
  );
};

export default WebcamComponent;
