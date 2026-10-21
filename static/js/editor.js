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


function buildHighlightedSentence(sentence, matches) {
  const p = document.createElement("p");
  p.className = "sentence";
  let cursor = 0;

  [...matches]
    .sort((a, b) => a.offset - b.offset)
    .forEach((m) => {
      if (m.offset < cursor) return; // ignora errores que se solapan
      p.append(sentence.slice(cursor, m.offset));
      const mark = document.createElement("mark");
      mark.textContent = sentence.slice(m.offset, m.offset + m.length);
      p.append(mark);
      cursor = m.offset + m.length;
    });

  p.append(sentence.slice(cursor));
  return p;
}

function showResult(sentence, matches) {
  result.replaceChildren();
  result.append(buildHighlightedSentence(sentence, matches));

  if (matches.length === 0) {
    const ok = document.createElement("p");
    ok.textContent = "✅ No encontré errores.";
    result.append(ok);
    return;
  }

  matches.forEach((m) => {
    const card = document.createElement("div");
    card.className = "card";

    const message = document.createElement("p");
    message.textContent = m.message;

    const suggestions = document.createElement("p");
    suggestions.className = "hidden";
    suggestions.textContent = m.suggestions.length
      ? "Sugerencias: " + m.suggestions.join(", ")
      : "Sin sugerencias automáticas.";

    const reveal = document.createElement("button");
    reveal.textContent = "Ver sugerencia";
    reveal.addEventListener("click", () => {
      suggestions.classList.remove("hidden");
      reveal.remove();
    });

    card.append(message, reveal, suggestions);
    result.append(card);
  });
}

checkBtn.addEventListener("click", checkLastSentence);