const editor = document.getElementById("editor");
const checkBtn = document.getElementById("check-btn");
const result = document.getElementById("result");

function lastSentence(text) {
  const parts = text.trim().split(/(?<=[.!?])\s+/);
  return parts[parts.length - 1];
}

async function checkLastSentence() {
  const sentence = lastSentence(editor.value);
  if (!sentence) {
    result.textContent = "Escribí una oración primero.";
    return;
  }

  result.textContent = "Revisando...";
  try {
    const response = await fetch("/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentence }),
    });
    const data = await response.json();
    if (!response.ok) {
      result.textContent = data.error || "Ocurrió un error.";
      return;
    }
    showResult(sentence, data.matches);
  } catch (err) {
    result.textContent = "No se pudo conectar con el servidor.";
  }
}

function showResult(sentence, matches) {
  result.replaceChildren();

  const original = document.createElement("p");
  original.textContent = "Oración: " + sentence;
  result.appendChild(original);

  if (matches.length === 0) {
    const ok = document.createElement("p");
    ok.textContent = "✅ No encontré errores.";
    result.appendChild(ok);
    return;
  }

  matches.forEach((m) => {
    const fragment = sentence.slice(m.offset, m.offset + m.length);
    const item = document.createElement("p");
    item.textContent =
      `"${fragment}": ${m.message} Sugerencias: ${m.suggestions.join(", ")}`;
    result.appendChild(item);
  });
}

checkBtn.addEventListener("click", checkLastSentence);