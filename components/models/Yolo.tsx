import ndarray from "ndarray";
import { Tensor } from "onnxruntime-web";
import ops from "ndarray-ops";
import { runModelUtils} from "../../utils/index";
import ObjectDetectionCamera from "../ObjectDetectionCamera";
import { round } from "lodash";
import { yoloClasses } from "../../data/yolo_classes";
import { RefObject } from "react";
import Webcam from "react-webcam";

const Yolo = (props: any) => {
  const preprocess = (ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const { data, width, height } = imageData;
    // data processing
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    ops.assign(
      dataProcessedTensor.pick(0, 0, null, null),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 1, null, null),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 2, null, null),
      dataTensor.pick(null, null, 2)
    );

    ops.divseq(dataProcessedTensor, 255);

    const tensor = new Tensor("float32", new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
  };

  

  const postprocess = async (
    tensor: Tensor,
    inferenceTime: number,
    ctx: CanvasRenderingContext2D,
  ) => {
    for (let i = 0; i < tensor.dims[0]; i++) {
      // const [batch_id, x0, y0, x1, y1, cls_id, score] = tensor.data.slice( will return a number[] type
      let [batch_id, x0, y0, x1, y1, cls_id, score] = tensor.data.slice(
        i * 7,
        i * 7 + 7
      );
      
      [batch_id, x0, y0, x1, y1, cls_id] = [
        batch_id,
        x0,
        y0,
        x1,
        y1,
        cls_id,
      ].map((x: any) => round(x));
      const box = [x0, y0, x1, y1].map((x: any) => round(x));

      [score] = [score].map((x: any) => round(x*100, 1));
      const label = yoloClasses[cls_id].toString()[0].toUpperCase() + yoloClasses[cls_id].toString().substring(1) + " " + score.toString()+"%";
      const color = [255, 125, 125];

      ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
			ctx.font = "20px Arial";
			ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			ctx.fillText(label, x0, y0-5);

			// fillrect with transparent color
			ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
			ctx.fillRect(x0, y0, x1 - x0, y1 - y0);


    }
  };

  
    

  return (
    <ObjectDetectionCamera
      width={props.width}
      height={props.height}
      preprocess={preprocess}
      postprocess={postprocess}
      modelUri={"./_next/static/chunks/pages/yolov7-tiny.onnx"}
      modelFilePath={"./_next/static/chunks/pages/yolov7-tiny.onnx"}
    />
  );
};

export default Yolo;
