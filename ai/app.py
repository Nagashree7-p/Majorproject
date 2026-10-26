from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import traceback

from face_recognition.recognize_face import recognize_face
from face_recognition.group_recognition import recognize_group
from crowd_analysis.detect_faces import detect_faces
from crowd_analysis.crowd_counter import analyze_crowd


app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "FaceGuard AI Engine is running"
    })


@app.route("/recognize", methods=["POST"])
def recognize():
    try:
        if "image" not in request.files:
            return jsonify({
                "message": "No image received"
            }), 400

        image = request.files["image"]

        if image.filename == "":
            return jsonify({
                "message": "Invalid image"
            }), 400

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        )

        image.save(temp_file.name)
        temp_file.close()

        try:
            result = recognize_face(temp_file.name)
            return jsonify(result)

        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "message": str(error)
        }), 500


@app.route("/group-recognize", methods=["POST"])
def group_recognize():
    try:
        if "image" not in request.files:
            return jsonify({
                "message": "No image received"
            }), 400

        image = request.files["image"]

        if image.filename == "":
            return jsonify({
                "message": "Invalid image"
            }), 400

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        )

        image.save(temp_file.name)
        temp_file.close()

        try:
            result = recognize_group(temp_file.name)
            return jsonify(result)

        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "message": str(error)
        }), 500


@app.route("/crowd-analyze", methods=["POST"])
def crowd_analyze():
    try:
        if "image" not in request.files:
            return jsonify({
                "message": "No image received"
            }), 400

        image = request.files["image"]

        if image.filename == "":
            return jsonify({
                "message": "Invalid image"
            }), 400

        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        )

        image.save(temp_file.name)
        temp_file.close()

        try:
            detection = detect_faces(temp_file.name)

            result = analyze_crowd(
                detection["total_faces"]
            )

            return jsonify(result)

        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )