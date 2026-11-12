import re

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check"

IM_VERBO = re.compile(
    r"\bI['’]m\s+(does|goes|has|likes|wants|plays|works|lives|needs|makes)\b",
    re.IGNORECASE,
)


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

    # Regla propia: "I'm" + verbo conjugado
    m = IM_VERBO.search(sentence)
    if m:
        matches.append({
            "message": "Después de \"I'm\" no va un verbo conjugado. ¿Quisiste decir \"I do\" o \"I'm doing\"?",
            "offset": m.start(),
            "length": m.end() - m.start(),
            "suggestions": [],
        })

    return jsonify({"matches": matches})


@app.route("/")
def index():
    return render_template("index.html")