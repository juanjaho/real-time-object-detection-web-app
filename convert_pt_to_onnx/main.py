from ultralytics import YOLO

# Load the YOLO model
model = YOLO("yolo12n.pt")

# Export the model to ONNX format
model.export(format="onnx", simplify=True, dynamic=True)
