# Convert YOLO models from ultralytics .pt to .onnx format that is compatible for onnxruntime webassembly

To retrieve a YOLO model from ultralytics, you need to install the `ultralytics` package. You can do this by running:

```bash
pip install ultralytics
```

To retrieve a YOLO model from ultralytics, you can use the following code:

```python
from ultralytics import YOLO

# Load the YOLOv8 model
model = YOLO("yolov10n.pt")

# Export the model to ONNX format
model.export(format="onnx", simplify=True, dynamic=True)

```

This will save the model in the `yolov10n.onnx` file. However, this model is not compatible for onnxruntime webassembly.

To convert the model to the compatible ONNX format, you can use the `onnxruntime` package. First, install the package:

```bash
pip install onnxruntime
```

Then run in the terminal:

```bash
python -m onnxruntime.tools.convert_onnx_models_to_ort yolov10n.onnx --save_optimized_onnx_model
```

This will save the optimized model in the `yolov10n.ort` file as well as the optimized ONNX model in the `yolov10n.optimized.onnx` file. Either of these files can be used in the web app.

# References

- [Onnxuntime Conversion Guide](https://onnxruntime.ai/docs/performance/model-optimizations/ort-format-models.html)
- [Ultralytics Export Guide](https://docs.ultralytics.com/modes/export)
