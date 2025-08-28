import ndarray from 'ndarray';
import { Tensor } from 'onnxruntime-web';
import ops from 'ndarray-ops';
import ObjectDetectionCamera from '../ObjectDetectionCamera';
import { round } from 'lodash';
import { yoloClasses } from '../../data/yolo_classes';
import { useState } from 'react';
import { useEffect } from 'react';
import { runModelUtils } from '../../utils';

const RES_TO_MODEL: [number[], string][] = [
  [[256, 256], 'yolo12n.onnx'],
  [[256, 256], 'yolo11n.onnx'],
  [[256, 256], 'yolov10n.onnx'],
  [[256, 256], 'yolov7-tiny_256x256.onnx'],
  [[320, 320], 'yolov7-tiny_320x320.onnx'],
  [[640, 640], 'yolov7-tiny_640x640.onnx'],
];

const Yolo = (props: any) => {
  const [modelResolution, setModelResolution] = useState<number[]>(
    RES_TO_MODEL[0][0]
  );
  const [modelName, setModelName] = useState<string>(RES_TO_MODEL[0][1]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const session = await runModelUtils.createModelCpu(
        `./_next/static/chunks/pages/${modelName}`
      );
      setSession(session);
    };
    getSession();
  }, [modelName, modelResolution]);

  const changeModelResolution = (width?: number, height?: number) => {
    if (width !== undefined && height !== undefined) {
      setModelResolution([width, height]);
      return;
    }
    const index = RES_TO_MODEL.findIndex((item) => item[0] === modelResolution);
    if (index === RES_TO_MODEL.length - 1) {
      setModelResolution(RES_TO_MODEL[0][0]);
      setModelName(RES_TO_MODEL[0][1]);
    } else {
      setModelResolution(RES_TO_MODEL[index + 1][0]);
      setModelName(RES_TO_MODEL[index + 1][1]);
    }
  };

  const resizeCanvasCtx = (
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number,
    inPlace = false
  ) => {
    let canvas: HTMLCanvasElement;

    if (inPlace) {
      // Get the canvas element that the context is associated with
      canvas = ctx.canvas;

      // Set the canvas dimensions to the target width and height
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Scale the context to the new dimensions
      ctx.scale(
        targetWidth / canvas.clientWidth,
        targetHeight / canvas.clientHeight
      );
    } else {
      // Create a new canvas element with the target dimensions
      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the source canvas into the target canvas
      canvas
        .getContext('2d')!
        .drawImage(ctx.canvas, 0, 0, targetWidth, targetHeight);

      // Get a new rendering context for the new canvas
      ctx = canvas.getContext('2d')!;
    }

    return ctx;
  };

  const preprocess = (ctx: CanvasRenderingContext2D) => {
    const resizedCtx = resizeCanvasCtx(
      ctx,
      modelResolution[0],
      modelResolution[1]
    );

    const imageData = resizedCtx.getImageData(
      0,
      0,
      modelResolution[0],
      modelResolution[1]
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

    const tensor = new Tensor('float32', new Float32Array(width * height * 3), [
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

  // map model name to corresponding postprocess function
  const postprocessMap: Record<string, PostprocessFunction> = {
    'yolo12n.onnx': postprocessYolov12,
    'yolo11n.onnx': postprocessYolov11,
    'yolov10n.onnx': postprocessYolov10,
    'yolov7-tiny_256x256.onnx': postprocessYolov7,
    'yolov7-tiny_320x320.onnx': postprocessYolov7,
    'yolov7-tiny_640x640.onnx': postprocessYolov7,
  };

  const postprocess = async (
    tensor: Tensor,
    inferenceTime: number,
    ctx: CanvasRenderingContext2D,
    modelName: string
  ) => {
    // Output tensor of yolov7-tiny is [det_num, 7]
    // while yolov10n is [1, all_boxes, 6]
    // Thus we need to handle them differently

    if (modelName in postprocessMap) {
      console.log('Using postprocess for', modelName);
      postprocessMap[modelName](ctx, modelResolution, tensor, conf2color);
    }
  };

  return (
    <ObjectDetectionCamera
      width={props.width}
      height={props.height}
      preprocess={preprocess}
      postprocess={postprocess}
      // resizeCanvasCtx={resizeCanvasCtx}
      session={session}
      changeCurrentModelResolution={changeModelResolution}
      currentModelResolution={modelResolution}
      modelName={modelName}
    />
  );
};

export default Yolo;

type PostprocessFunction = (
  ctx: CanvasRenderingContext2D,
  modelResolution: number[],
  tensor: Tensor,
  conf2color: (conf: number) => string
) => void;

// Non-Maximum Suppression helper function
const applyNMS = (
  detections: Array<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    confidence: number;
    classId: number;
  }>,
  iouThreshold: number
) => {
  // Sort detections by confidence (highest first)
  detections.sort((a, b) => b.confidence - a.confidence);

  const keep: boolean[] = new Array(detections.length).fill(true);

  for (let i = 0; i < detections.length; i++) {
    if (!keep[i]) continue;

    const boxA = detections[i];
    for (let j = i + 1; j < detections.length; j++) {
      if (!keep[j]) continue;

      const boxB = detections[j];

      // Only apply NMS within the same class
      if (boxA.classId !== boxB.classId) continue;

      // Calculate IoU (Intersection over Union)
      const iou = calculateIoU(boxA, boxB);

      if (iou > iouThreshold) {
        keep[j] = false;
      }
    }
  }

  return detections.filter((_, index) => keep[index]);
};

// Calculate Intersection over Union (IoU)
const calculateIoU = (
  boxA: { x0: number; y0: number; x1: number; y1: number },
  boxB: { x0: number; y0: number; x1: number; y1: number }
) => {
  // Calculate intersection coordinates
  const x0 = Math.max(boxA.x0, boxB.x0);
  const y0 = Math.max(boxA.y0, boxB.y0);
  const x1 = Math.min(boxA.x1, boxB.x1);
  const y1 = Math.min(boxA.y1, boxB.y1);

  // Calculate intersection area
  const intersectionArea = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);

  // Calculate union area
  const boxAArea = (boxA.x1 - boxA.x0) * (boxA.y1 - boxA.y0);
  const boxBArea = (boxB.x1 - boxB.x0) * (boxB.y1 - boxB.y0);
  const unionArea = boxAArea + boxBArea - intersectionArea;

  return intersectionArea / unionArea;
};

const postprocessYolov12: PostprocessFunction = (
  ctx: CanvasRenderingContext2D,
  modelResolution: number[],
  tensor: Tensor,
  conf2color: (conf: number) => string
) => {
  postprocessYolov11(ctx, modelResolution, tensor, conf2color);
};

const postprocessYolov11: PostprocessFunction = (
  ctx: CanvasRenderingContext2D,
  modelResolution: number[],
  tensor: Tensor,
  conf2color: (conf: number) => string
) => {
  const dx = ctx.canvas.width / modelResolution[0];
  const dy = ctx.canvas.height / modelResolution[1];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // YOLOv11n output: [1, 84, 1344]
  // Shape: [batch, features, anchors] where features = 4 (bbox) + 80 (classes)
  const numClasses = 80;
  const numAnchors = tensor.dims[2]; // 1344
  const confidenceThreshold = 0.25;

  const detections: Array<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    confidence: number;
    classId: number;
  }> = [];

  // Process each anchor
  for (let i = 0; i < numAnchors; i++) {
    // Extract box coordinates (first 4 values)
    const x_center = (tensor.data as Float32Array)[i]; // index: 0 * numAnchors + i
    const y_center = (tensor.data as Float32Array)[numAnchors + i]; // index: 1 * numAnchors + i
    const width = (tensor.data as Float32Array)[2 * numAnchors + i]; // index: 2 * numAnchors + i
    const height = (tensor.data as Float32Array)[3 * numAnchors + i]; // index: 3 * numAnchors + i

    // Extract class probabilities (next 80 values)
    let maxClassScore = 0;
    let maxClassId = 0;

    for (let j = 0; j < numClasses; j++) {
      const classScore = (tensor.data as Float32Array)[
        (4 + j) * numAnchors + i
      ];
      if (classScore > maxClassScore) {
        maxClassScore = classScore;
        maxClassId = j;
      }
    }

    // Filter by confidence threshold
    if (maxClassScore > confidenceThreshold) {
      // Convert center coordinates to corner coordinates
      const x0 = x_center - width / 2;
      const y0 = y_center - height / 2;
      const x1 = x_center + width / 2;
      const y1 = y_center + height / 2;

      detections.push({
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        confidence: maxClassScore,
        classId: maxClassId,
      });
    }
  }

  // Apply Non-Maximum Suppression (simple version)
  const nmsDetections = applyNMS(detections, 0.4);

  // Draw the detections
  for (const detection of nmsDetections) {
    // Scale to canvas size
    const x0 = detection.x0 * dx;
    const y0 = detection.y0 * dy;
    const x1 = detection.x1 * dx;
    const y1 = detection.y1 * dy;

    const score = round(detection.confidence * 100, 1);
    const label =
      yoloClasses[detection.classId].toString()[0].toUpperCase() +
      yoloClasses[detection.classId].toString().substring(1) +
      ' ' +
      score.toString() +
      '%';
    const color = conf2color(detection.confidence);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.font = '20px Arial';
    ctx.fillStyle = color;
    ctx.fillText(label, x0, y0 - 5);

    // Fill rect with transparent color
    ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
};

const postprocessYolov10: PostprocessFunction = (
  ctx: CanvasRenderingContext2D,
  modelResolution: number[],
  tensor: Tensor,
  conf2color: (conf: number) => string
) => {
  const dx = ctx.canvas.width / modelResolution[0];
  const dy = ctx.canvas.height / modelResolution[1];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  let x0, y0, x1, y1, cls_id, score;
  // yolov10n output tensor is [1, all_boxes, 6]
  // console.log(tensor.dims);
  for (let i = 0; i < tensor.dims[1]; i += 6) {
    [x0, y0, x1, y1, score, cls_id] = tensor.data.slice(i, i + 6);
    if ((score as any) < 0.25) {
      break;
    }

    // scale to canvas size
    [x0, x1] = [x0, x1].map((x: any) => x * dx);
    [y0, y1] = [y0, y1].map((x: any) => x * dy);

    [x0, y0, x1, y1, cls_id] = [x0, y0, x1, y1, cls_id].map((x: any) =>
      round(x)
    );

    [score] = [score].map((x: any) => round(x * 100, 1));
    const label =
      yoloClasses[cls_id].toString()[0].toUpperCase() +
      yoloClasses[cls_id].toString().substring(1) +
      ' ' +
      score.toString() +
      '%';
    const color = conf2color(score / 100);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.font = '20px Arial';
    ctx.fillStyle = color;
    ctx.fillText(label, x0, y0 - 5);

    // fillrect with transparent color
    ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
};

const postprocessYolov7: PostprocessFunction = (
  ctx: CanvasRenderingContext2D,
  modelResolution: number[],
  tensor: Tensor,
  conf2color: (conf: number) => string
) => {
  const dx = ctx.canvas.width / modelResolution[0];
  const dy = ctx.canvas.height / modelResolution[1];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  let batch_id, x0, y0, x1, y1, cls_id, score;
  // Output tensor of yolov7-tiny is [det_num, 7]
  // console.log(tensor.dims);
  for (let i = 0; i < tensor.dims[0]; i++) {
    [batch_id, x0, y0, x1, y1, cls_id, score] = tensor.data.slice(
      i * 7,
      i * 7 + 7
    );

    // scale to canvas size
    [x0, x1] = [x0, x1].map((x: any) => x * dx);
    [y0, y1] = [y0, y1].map((x: any) => x * dy);

    [x0, y0, x1, y1, cls_id] = [x0, y0, x1, y1, cls_id].map((x: any) =>
      round(x)
    );

    [score] = [score].map((x: any) => round(x * 100, 1));
    const label =
      yoloClasses[cls_id].toString()[0].toUpperCase() +
      yoloClasses[cls_id].toString().substring(1) +
      ' ' +
      score.toString() +
      '%';
    const color = conf2color(score / 100);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.font = '20px Arial';
    ctx.fillStyle = color;
    ctx.fillText(label, x0, y0 - 5);

    // fillrect with transparent color
    ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
};
