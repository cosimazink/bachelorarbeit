(() => {
    let selectionMode = false;
    let currentHoverElement = null;
    let selectedElement = null;

    const INTERNAL_CLASSES = ["hover-outline", "selected-outline"];

    console.log("Content Script geladen (POC 01).");

    // Entfernt den Hover-Zustand vom aktuell gehighlighteten Element
    function clearHover() {
        if (currentHoverElement) {
            currentHoverElement.classList.remove("hover-outline");
            currentHoverElement = null;
        }
    }

    // Entfernt den Auswahl-Zustand vom zuletzt ausgewählten Element
    function clearSelected() {
        if (selectedElement) {
            selectedElement.classList.remove("selected-outline");
            selectedElement = null;
        }
    }

    // Hebt das Element unter dem Mauszeiger hervor
    function handleMouseOver(event) {
        if (!selectionMode) return;

        const target = event.target;
        if (target === currentHoverElement || target === selectedElement) return;

        clearHover();
        currentHoverElement = target;
        currentHoverElement.classList.add("hover-outline");
    }

    // Selektiert das angeklickte Element und erstellt dessen Payload
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

        chrome.storage.local.set({ lastSelection: payload }, () => {
            console.log("Selektiertes Element-Payload wurde in chrome.storage.local gespeichert.");
        });

    }

    // Erstellt ein strukturiertes Payload-Objekt für das ausgewählte Element (HTML, Styles, Kontext)
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

        // Erfasst alle CSS-Klassen des Elements
        const allClasses = element.className
            ? element.className.split(/\s+/).filter(Boolean)
            : [];

        // Entfernt interne Hilfsklassen aus der Liste
        const classes = allClasses.filter(
            (cls) => !INTERNAL_CLASSES.includes(cls)
        );

        // Bereinigt das HTML des Elements von internen Klassen
        const clone = element.cloneNode(true);
        INTERNAL_CLASSES.forEach((cls) => clone.classList.remove(cls));
        const wrapper = document.createElement("div");
        wrapper.appendChild(clone);
        const cleanOuterHTML = wrapper.innerHTML;

        return {
            tagName: element.tagName,
            id: element.id || null,
            classes,
            innerText: element.innerText?.trim() || null,
            outerHTML: cleanOuterHTML,
            basicStyles,
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

    // Aktiviert den Auswahlmodus nach Anforderung vom Popup
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

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleClick, true);
})();
