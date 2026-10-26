import cv2
import numpy as np
from insightface.app import FaceAnalysis


app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(
    ctx_id=0,
    det_size=(1024, 1024)
)


def detect_faces(image_path):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image")

    faces = app.get(image)

    boxes = []

    for face in faces:
        x1, y1, x2, y2 = face.bbox

        boxes.append({
            "x": int(x1),
            "y": int(y1),
            "width": int(x2 - x1),
            "height": int(y2 - y1)
        })

    return {
        "total_faces": len(faces),
        "boxes": boxes
    }