import ndarray from "ndarray";
import { Tensor } from "onnxruntime-web";
import ops from "ndarray-ops";
import ObjectDetectionCamera from "../ObjectDetectionCamera";
import { round } from "lodash";
import { yoloClasses } from "../../data/yolo_classes";

const INPUT_DIM_WIDTH = 640;
const INPUT_DIM_HEIGHT = 640;

const Yolo = (props: any) => {
  const resizeCanvasCtx = (
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number
  ) => {
    ctx.canvas.width = targetWidth;
    ctx.canvas.height = targetHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(ctx.canvas, 0, 0, targetWidth, targetHeight);
  };

  const preprocess = (ctx: CanvasRenderingContext2D) => {
    // resizeCanvasCtx(ctx, INPUT_DIM_WIDTH, INPUT_DIM_HEIGHT);

    const imageData = ctx.getImageData(0, 0, INPUT_DIM_HEIGHT, INPUT_DIM_WIDTH);
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

  const conf2color = (conf: number) => {
    const r = Math.round(255 * (1 - conf));
    const g = Math.round(255 * conf);
    return `rgb(${r},${g},0)`;
  };

  const postprocess = async (
    tensor: Tensor,
    inferenceTime: number,
    ctx: CanvasRenderingContext2D
  ) => {
    for (let i = 0; i < tensor.dims[0]; i++) {
      // const [batch_id, x0, y0, x1, y1, cls_id, score] = tensor.data.slice( will return a number[] type
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // resizeCanvasCtx(ctx, INPUT_DIM_WIDTH, INPUT_DIM_HEIGHT);

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

      [score] = [score].map((x: any) => round(x * 100, 1));
      const label =
        yoloClasses[cls_id].toString()[0].toUpperCase() +
        yoloClasses[cls_id].toString().substring(1) +
        " " +
        score.toString() +
        "%";
      const color = conf2color(score / 100);
      // const color = [255, 125, 125];

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      ctx.font = "20px Arial";
      ctx.fillStyle = color;
      ctx.fillText(label, x0, y0 - 5);

      // fillrect with transparent color
      ctx.fillStyle = color.replace(")", ", 0.2)").replace("rgb", "rgba");
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  };

  return (
    <ObjectDetectionCamera
      width={props.width}
      height={props.height}
      preprocess={preprocess}
      postprocess={postprocess}
      resizeCanvasCtx={resizeCanvasCtx}
      modelUri={"./_next/static/chunks/pages/yolov7-tiny.onnx"}
      modelFilePath={"./_next/static/chunks/pages/yolov7-tiny.onnx"}
    />
  );
};

export default Yolo;
