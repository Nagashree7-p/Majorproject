import json
import os
import numpy as np
from .generate_embedding import generate_embedding

DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "registered_faces.json"
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
        np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
    )


def recognize_face(image_path, threshold=0.45):
    registered_faces = load_registered_faces()

    if not registered_faces:
        raise ValueError("No registered faces found")

    input_embedding = generate_embedding(image_path)

    best_match = None
    best_score = -1

    for name, person in registered_faces.items():
        score = cosine_similarity(
            input_embedding,
            person["embedding"]
        )

        if score > best_score:
            best_score = score
            best_match = name

    if best_score >= threshold:
        return {
            "recognized": True,
            "name": best_match,
            "confidence": round(float(best_score) * 100, 2)
        }

    return {
        "recognized": False,
        "name": "Unknown",
        "confidence": round(float(best_score) * 100, 2)
    }


if __name__ == "__main__":
    image_path = input("Enter image path: ")

    try:
        result = recognize_face(image_path)

        print("Recognition Result")
        print("Name:", result["name"])
        print("Confidence:", result["confidence"], "%")

    except Exception as e:
        print("Recognition failed:", e)