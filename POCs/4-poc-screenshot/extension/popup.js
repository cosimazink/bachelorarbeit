document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-selection");
  const preview = document.getElementById("payload-preview");
  const generateBtn = document.getElementById("generate");
  const presetEl = document.getElementById("promptPreset");
  const extraEl = document.getElementById("promptExtra");
  const statusEl = document.getElementById("status");
  const outEl = document.getElementById("llm-output");
  const copyBtn = document.getElementById("copy");
  const uploadInput = document.getElementById("screenshotUpload");
  const clearUploadBtn = document.getElementById("clearUpload");
  const uploadedPreview = document.getElementById("uploadedPreview");

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File read failed"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = dataUrl;
    });
  }

  // Kompremierung des Screenshots
  async function downscaleDataUrl(dataUrl, { maxW = 768, maxH = 768, quality = 0.75 } = {}) {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const scale = Math.min(1, maxW / w, maxH / h);
    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, nw, nh);

    return canvas.toDataURL("image/jpeg", quality);
  }

  async function setUploadedScreenshot(dataUrlOrNull) {
    if (!dataUrlOrNull) {
      await chrome.storage.local.remove(["uploadedScreenshot"]);
      uploadedPreview.style.display = "none";
      uploadedPreview.src = "";
      uploadInput.value = "";
      return;
    }

    await chrome.storage.local.set({ uploadedScreenshot: dataUrlOrNull });
    uploadedPreview.src = dataUrlOrNull;
    uploadedPreview.style.display = "block";
  }

  chrome.storage.local.get("uploadedScreenshot", (res) => {
    if (res.uploadedScreenshot) {
      uploadedPreview.src = res.uploadedScreenshot;
      uploadedPreview.style.display = "block";
    }
  });

  function setOutput(code) {
    outEl.textContent = code || "{ noch kein Output }";
    copyBtn.disabled = !code;
  }

  function clearOutput(reason = "") {
    // optional: du kannst reason nutzen, um eine Statusmeldung zu zeigen
    setOutput("");
    chrome.storage.local.remove(["lastGeneratedCode"]);
    if (reason) setStatus(reason);
  }

  function clearExtra(reason = "") {
    extraEl.value = "";
    chrome.storage.local.remove(["lastPromptExtra"]);
    if (reason) setStatus(reason);
  }

  function saveExtra() {
    chrome.storage.local.set({ lastPromptExtra: extraEl.value || "" });
  }

  function setButtonState(isOn) {
    btn.dataset.mode = isOn ? "on" : "off";
    btn.textContent = isOn ? "Select Mode: ON (click to stop)" : "Select Mode: OFF (click to start)";
  }

  // UI-Statusmeldung im Popup anzeigen (Info/Fehler)
  function setStatus(text, type = "info") {
    statusEl.textContent = text;
    statusEl.classList.remove("hidden");
    statusEl.style.borderColor = type === "error" ? "#ef4444" : "#d1d5db";
  }

  // Statusmeldung ausblenden
  function clearStatus() {
    statusEl.classList.add("hidden");
    statusEl.textContent = "";
  }

  // Ladezustand (Button disable + Text ändern)
  function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? "Generating..." : "Generate Code";
  }

  // Prompt aus Preset + optionalen Zusatzhinweisen bauen
  function buildPrompt(preset, extra) {
    const base = {
      vanilla_webcomponent: `
      TASK:
      Create a single-file Web Component using Vanilla JavaScript.

      GOAL:
      Reconstruct the selected UI element as visually close as possible to the original.

      CONTEXT:
      You do NOT have access to the original JavaScript logic.
      You must infer visual structure and interaction behavior solely from the provided data:
      - outerHTML
      - computed styles
      - hover and focus style snapshots
      - attributes and basic text content

      INSTRUCTIONS:
      - Build a fully self-contained component (no external libraries, no frameworks).
      - Reconstruct layout, styling, and simple interactions (e.g. hover/focus effects) by inference.
      - Do NOT attempt to replicate business logic or network behavior.

      REQUIRED OUTPUT:
      - One complete file (e.g. index.html or component.js)
      - Must include:
        - HTML template
        - Scoped CSS
        - JavaScript
      `,
      snippet_html_css: `
      TASK:
      Create a minimal HTML + CSS snippet that visually replicates the selected element.

      GOAL:
      Achieve maximum visual similarity with minimal code.

      CONTEXT:
      No JavaScript logic is available.
      Reconstruct the element using only:
      - outerHTML
      - computed styles
      - hover/focus style snapshots

      INSTRUCTIONS:
      - Focus on structure, spacing, typography, and visual states.
      - Keep the output as compact as possible.
      - Do NOT include JavaScript.

      OUTPUT RULES:
      - Return ONLY raw HTML and CSS.
      `
    };

    return (base[preset] || base.vanilla_webcomponent) + (extra ? `\nZusatzhinweise:\n${extra}\n` : "");
  }

  // Beim Öffnen: letzte Auswahl laden
  chrome.storage.local.get("lastSelection", (result) => {
    if (result.lastSelection) {
      preview.textContent = JSON.stringify(result.lastSelection, null, 2);
    } else {
      preview.textContent = "{ noch kein Element ausgewählt }";
    }
  });

  // Beim Öffnen: letzten Output laden
  chrome.storage.local.get("lastGeneratedCode", (result) => {
    if (result.lastGeneratedCode) {
      setOutput(result.lastGeneratedCode);
    } else {
      setOutput("");
    }
  });

  // Beim Öffnen: Zusatzhinweis + Preset laden
  chrome.storage.local.get(["lastPromptExtra", "lastPromptPreset"], (result) => {
    if (typeof result.lastPromptExtra === "string") {
      extraEl.value = result.lastPromptExtra;
    }
    if (typeof result.lastPromptPreset === "string") {
      presetEl.value = result.lastPromptPreset;
    }
  });

  // Beim Öffnen: aktuellen State vom Content Script abfragen
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION_STATE" }, (res) => {
      // falls content script nicht verfügbar (z.B. chrome:// pages)
      if (chrome.runtime.lastError) {
        setButtonState(false);
        return;
      }
      setButtonState(!!res?.selectionMode);
    });
  });

  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("Kein aktiver Tab gefunden.");
        return;
      }

      const isOn = btn.dataset.mode === "on";
      const nextType = isOn ? "STOP_SELECTION" : "START_SELECTION";

      chrome.tabs.sendMessage(tab.id, { type: nextType }, (res) => {
        if (chrome.runtime.lastError) {
          preview.textContent =
            "{ Fehler: Content Script nicht erreichbar (z.B. interne Browser-Seite oder blockierter Kontext) }";
          setButtonState(false);
          return;
        }

        setButtonState(!!res?.selectionMode);

        const turnedOn = !isOn; // weil nextType = START_SELECTION wenn isOn=false
        if (turnedOn) {
          clearOutput("Select Mode aktiv – Output zurückgesetzt.");
          clearExtra("Select Mode aktiv – Zusatzhinweis zurückgesetzt.");
        }

        preview.textContent = isOn
          ? "{ Select Mode deaktiviert. }"
          : "{ Select Mode aktiv. Fahre über die Seite und klicke auf ein Element ... }";
      });
    });
  });

  let lastSerialized = null;
  setInterval(() => {
    chrome.storage.local.get("lastSelection", (result) => {
      if (!result.lastSelection) return;
      const serialized = JSON.stringify(result.lastSelection, null, 2);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        preview.textContent = serialized;

        if (hadPrevious) {
          clearOutput("Neue Auswahl erkannt – Output zurückgesetzt.");
        }
        hadPrevious = true;
      }
    });
  }, 800);

  generateBtn.addEventListener("click", async () => {
    clearStatus();
    setLoading(true);
    outEl.textContent = "{ generating... }";
    copyBtn.disabled = true;

    try {
      const { lastSelection } = await chrome.storage.local.get("lastSelection");
      if (!lastSelection) {
        throw new Error("Kein Payload gefunden. Bitte erst ein Element auswählen (POC 04).");
      }

      const prompt = buildPrompt(presetEl.value, extraEl.value.trim());
      const { uploadedScreenshot } = await chrome.storage.local.get("uploadedScreenshot");

      const res = await fetch("http://localhost:8787/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(presetEl.value, ""),
          extra: extraEl.value.trim(),
          payload: lastSelection,
          imageDataUrl: uploadedScreenshot || null
        })
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`API Error (${res.status}): ${msg || "unknown"}`);
      }

      const data = await res.json();
      const code = data.code || "";
      setOutput(code);
      await chrome.storage.local.set({ lastGeneratedCode: code });
      setStatus("Done");
    } catch (err) {
      setStatus(err.message || "Unbekannter Fehler", "error");
      outEl.textContent = "{ error }";
    } finally {
      setLoading(false);
    }
  });

  copyBtn.addEventListener("click", async () => {
    const text = outEl.textContent || "";
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard");
  });

  extraEl.addEventListener("input", () => {
    saveExtra();
  });

  uploadInput.addEventListener("change", async () => {
    clearStatus();
    try {
      const file = uploadInput.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        throw new Error("Bitte eine Bilddatei auswählen.");
      }

      const raw = await readFileAsDataURL(file);
      const optimized = await downscaleDataUrl(raw, { maxW: 768, maxH: 768, quality: 0.75 });

      await setUploadedScreenshot(optimized);
      setStatus("Screenshot hochgeladen (verkleinert).");
    } catch (e) {
      setStatus(e?.message || "Upload fehlgeschlagen", "error");
      await setUploadedScreenshot(null);
    }
  });

  clearUploadBtn.addEventListener("click", async () => {
    await setUploadedScreenshot(null);
    setStatus("Upload entfernt.");
  });
});