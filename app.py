from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check"


@app.route("/check", methods=["POST"])
def check():
    data = request.get_json(silent=True) or {}
    sentence = data.get("text", "").strip()

    if not sentence:
        return jsonify({"matches": []})

    try:
        r = requests.post(
            LANGUAGETOOL_URL,
            data={"text": sentence, "language": "en-US"},
            timeout=10,
        )
        r.raise_for_status()
    except requests.RequestException:
        return jsonify({"error": "No se pudo contactar al corrector"}), 502

    matches = [
        {
            "message": m["message"],
            "offset": m["offset"],
            "length": m["length"],
            "suggestions": [s["value"] for s in m["replacements"][:3]],
        }
        for m in r.json()["matches"]
    ]
    return jsonify({"matches": matches})

@app.route("/")
def index():
    return render_template("index.html")