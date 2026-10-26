import cv2
import numpy as np
import json
import sys
from insightface.app import FaceAnalysis

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(ctx_id=0, det_size=(640, 640))


def generate_embedding(image_path):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image")

    faces = app.get(image)

    if len(faces) == 0:
        raise ValueError("No face detected")

    if len(faces) > 1:
        raise ValueError("Multiple faces detected. Please use an image with one face")

    embedding = faces[0].embedding
    embedding = embedding / np.linalg.norm(embedding)

    return embedding.tolist()


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Image path is required")

        image_path = sys.argv[1]

        embedding = generate_embedding(image_path)

        print("Face detected successfully")
        print("Embedding size:", len(embedding))
        print("EMBEDDING:" + json.dumps(embedding))

    except Exception as e:
        print("Error:", e)
        sys.exit(1)