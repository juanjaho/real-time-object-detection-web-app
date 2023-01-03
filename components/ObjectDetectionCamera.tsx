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
      />
      <div>
        <button
          onClick={capture}
          className="p-2 mr-3 my-5 border-dashed border-2 rounded-xl "
        >
          Capture photo
        </button>
        <button
          onClick={clear}
          className="p-2 my-5 border-dashed border-2 rounded-xl "
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
