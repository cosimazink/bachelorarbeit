(() => {
  let selectionMode = false;
  let currentHoverElement = null;
  let selectedElement = null;

  console.log("Content Script geladen (POC 01).");

  function clearHover() {
    if (currentHoverElement) {
      currentHoverElement.classList.remove("hover-outline");
      currentHoverElement = null;
    }
  }

  function clearSelected() {
    if (selectedElement) {
      selectedElement.classList.remove("selected-outline");
      selectedElement = null;
    }
  }

  function handleMouseOver(event) {
    if (!selectionMode) return;

    const target = event.target;
    if (target === currentHoverElement || target === selectedElement) return;

    clearHover();
    currentHoverElement = target;
    currentHoverElement.classList.add("hover-outline");
  }

  function handleClick(event) {
    if (!selectionMode) return;

    event.preventDefault();
    event.stopPropagation();

    clearHover();
    clearSelected();

    selectedElement = event.target;
    selectedElement.classList.add("selected-outline");

    selectionMode = false;

    const payload = buildElementPayload(selectedElement);

    console.log("Selektiertes Element-Payload:", payload);

    // Hier könntest du später chrome.runtime.sendMessage(payload) nutzen,
    // um die Daten an Background oder Popup/Backend zu schicken.
    chrome.runtime.sendMessage(
      {
        type: "ELEMENT_SELECTED",
        payload
      },
      () => {
        // optional Callback
      }
    );
  }

  function buildElementPayload(element) {
    const computed = window.getComputedStyle(element);

    const basicStyles = {
      display: computed.display,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
      border: computed.border
    };

    return {
      tagName: element.tagName,
      id: element.id || null,
      classes: element.className
        ? element.className.split(/\s+/).filter(Boolean)
        : [],
      innerText: element.innerText?.trim() || null,
      outerHTML: element.outerHTML,
      basicStyles,
      // Optional: etwas Kontext: Parent-Tag & seine Klassen
      parent: element.parentElement
        ? {
            tagName: element.parentElement.tagName,
            classes: element.parentElement.className
              ? element.parentElement.className
                  .split(/\s+/)
                  .filter(Boolean)
              : []
          }
        : null
    };
  }

  // Nachrichten vom Popup empfangen
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "START_SELECTION") {
      selectionMode = true;
      clearHover();
      clearSelected();
      console.log(
        "Auswahlmodus aktiviert. Fahre über die Seite und klicke auf ein Element."
      );
      sendResponse({ ok: true });
    }
  });

  // Event Listener global registrieren
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("click", handleClick, true);
})();
