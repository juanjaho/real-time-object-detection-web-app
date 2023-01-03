//create body with webcam and image
import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import Image from "next/image";
import { useState } from "react";

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
      <button 
            onClick={capture}
            className = "p-3"
            >Capture photo</button>
      {imgSrc && (
        <Image
          src