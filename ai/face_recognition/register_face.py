import json
import os
from generate_embedding import generate_embedding

DATA_FILE = os.path.join(
    os.path.dirname(__file__),
    "registered_faces.json"
)


def load_registered_faces():
    if not os.path.exists(DATA_FILE):
        return {}

    with open(DATA_FILE, "r") as file:
        return json.load(file)


def save_registered_faces(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)


def register_face(name, image_path):
    data = load_registered_faces()

    if name in data:
        raise ValueError("This person is already registered")

    embedding = generate_embedding(image_path)

    data[name] = {
        "name": name,
        "embedding": embedding
    }

    save_registered_faces(data)

    return True


if __name__ == "__main__":
    name = input("Enter person's name: ")
    image_path = input("Enter image path: ")

    try:
        register_face(name, image_path)
        print("Face registered successfully")
    except Exception as e:
        print("Registration failed:", e)