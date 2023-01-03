// import React, { useRef, useEffect } from "react";

// const VideoCamera = (props: any) => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       } else {
//         console.log("videoRef.current is null");
//       }
//     });
//   }, []);

//   return (
//     <video ref={videoRef} width={props.width} height={props.height} autoPlay />
//   );
// };

// export default VideoCamera;

import React from "react";
import Webcam from "react-webcam";

const WebcamComponent = (props: any) =>{

    return (
        <Webcam />
    )
    
}




export default WebcamComponent;
