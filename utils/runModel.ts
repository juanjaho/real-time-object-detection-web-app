import { InferenceSession, Tensor } from "onnxruntime-web";

export async function createModelCpu(
  url: string
): Promise<InferenceSession> {
  return await InferenceSession.create(url, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

export async function runModel(
  model: InferenceSession,
  preprocessedData: Tensor
): Promise<[Tensor, number]> {
  const start = new Date();
  try {
    const feeds: Record<string, Tensor> = {};
    feeds[model.inputNames[0]] = preprocessedData;
    console.log(feeds);
    const outputData = await model.run(feeds);
    const end = new Date();
    const inferenceTime = end.getTime() - start.getTime();
    const output = outputData[model.outputNames[0]];

    return [output, inferenceTime];
  } catch (e) {
    console.error(e);
    throw new Error();
  }
}
