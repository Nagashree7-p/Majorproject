import json
import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis

DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "registered_faces.json"
)

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(
    ctx_id=0,
    det_size=(1024, 1024)
)


def load_registered_faces():
    if not os.path.exists(DATA_FILE):
        return {}

    with open(DATA_FILE, "r") as file:
        return json.load(file)


def cosine_similarity(embedding1, embedding2):
    embedding1 = np.array(embedding1)
    embedding2 = np.array(embedding2)

    return np.dot(embedding1, embedding2) / (
        np.linalg.norm(embedding1) *
        np.linalg.norm(embedding2)
    )


def recognize_group(image_path, threshold=0.45):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image")

    registered_faces = load_registered_faces()

    faces = app.get(image)

    results = []

    recognized_count = 0
    unknown_count = 0

    for face in faces:

        embedding = face.embedding

        embedding = embedding / np.linalg.norm(embedding)

        best_match = None
        best_score = -1

        for name, person in registered_faces.items():

            score = cosine_similarity(
                embedding,
                person["embedding"]
            )

            if score > best_score:
                best_score = score
                best_match = name

        if best_score >= threshold:

            recognized_count += 1

            results.append({
                "name": best_match,
                "recognized": True,
                "confidence": round(
                    float(best_score) * 100,
                    2
                ),
                "box": [
                    int(face.bbox[0]),
                    int(face.bbox[1]),
                    int(face.bbox[2]),
                    int(face.bbox[3])
                ]
            })

        else:

            unknown_count += 1

            results.append({
                "name": "Unknown",
                "recognized": False,
                "confidence": round(
                    float(best_score) * 100,
                    2
                ),
                "box": [
                    int(face.bbox[0]),
                    int(face.bbox[1]),
                    int(face.bbox[2]),
                    int(face.bbox[3])
                ]
            })

    return {
        "total_faces": len(faces),
        "recognized": recognized_count,
        "unknown": unknown_count,
        "results": results
    }


if __name__ == "__main__":

    image_path = input(
        "Enter group image path: "
    )

    try:

        result = recognize_group(image_path)

        print("\nGroup Recognition Result")

        print(
            "Total Faces:",
            result["total_faces"]
        )

        print(
            "Recognized:",
            result["recognized"]
        )

        print(
            "Unknown:",
            result["unknown"]
        )

        for person in result["results"]:

            print(
                person["name"],
                "-",
                person["confidence"],
                "%"
            )

    except Exception as error:

        print(
            "Recognition failed:",
            error
        )