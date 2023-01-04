import ndarray from "ndarray";
import { Tensor } from "onnxruntime-web";
import ops from "ndarray-ops";
import { runModelUtils, yolo, yoloTransforms } from "../../utils/index";



const Yolo = () => {
  const preprocess = (ctx: CanvasRenderingContext2D): Tensor => {
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

    const tensor = new Tensor("float32", new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
  };

  const postprocess = async (tensor: Tensor, inferenceTime: number) => {
    try {
      const originalOutput = new Tensor(
        "float32",
        tensor.data as Float32Array,
        [1, 125, 13, 13]
      );
      const outputTensor = yoloTransforms.transpose(
        originalOutput,
        [0, 2, 3, 1]
      );

      // postprocessing
      const boxes = await yolo.postprocess(outputTensor, 20);
      boxes.forEach((box) => {
        const { top, left, bottom, right, classProb, className } = box;

        drawRect(
          left,
          top,
          right - left,
          bottom - top,
          `${className} Confidence: ${Math.round(
            classProb * 100
          )}% Time: ${inferenceTime.toFixed(1)}ms`
        );
      });
    } catch (e) {
      alert("Model is not valid!");
    }
  };
  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    text = "",
    color = "red"
  ) => {
    const webcamContainerElement = document.getElementById(
      "webcam-container"
    ) as HTMLElement;
    // Depending on the display size, webcamContainerElement might be smaller than 416x416.
    const [ox, oy] = [
      (webcamContainerElement.offsetWidth - 416) / 2,
      (webcamContainerElement.offsetHeight - 416) / 2,
    ];
    const rect = document.createElement("div");
    rect.style.cssText = `top: ${y + oy}px; left: ${
      x + ox
    }px; width: ${w}px; height: ${h}px; border-color: ${color};`;
    const label = document.createElement("div");
    label.innerText = text;
    rect.appendChild(label);

    webcamContainerElement.appendChild(rect);
  };
};
