(() => {
    let selectionMode = false;
    let currentHoverElement = null;
    let selectedElement = null;

    const INTERNAL_CLASSES = ["hover-outline", "selected-outline"];

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

    function setSelectionMode(next) {
        selectionMode = next;
        if (!selectionMode) {
            clearHover();
            clearSelected();
        }
    }

    function isInternalOutline(outlineValue) {
        if (!outlineValue) return false;
        const v = String(outlineValue).toLowerCase();
        // deine POC-Farben / outlines
        return v.includes("rgb(232, 76, 120)") || v.includes("#e84c78") || v.includes("orange");
    }

    function sanitizeStyleSnapshot(styles) {
        const cleaned = { ...styles };

        // Entferne internal outlines, die durch hover/selected classes entstehen
        if (isInternalOutline(cleaned.outline)) {
            cleaned.outline = "none";
        }

        // Optional: falls du jemals cursor: crosshair o.ä. übernimmst
        if (String(cleaned.cursor || "").toLowerCase() === "crosshair") {
            cleaned.cursor = "default";
        }

        return cleaned;
    }

    // Nur die wirklich nützlichen Attribute extrahieren
    function extractAttributes(el) {
        const attrs = {};
        for (const attr of Array.from(el.attributes || [])) {
            const name = attr.name;
            const value = attr.value;

            // keep: aria-*, data-*, href/src/type/name/role
            if (
                name.startsWith("aria-") ||
                name.startsWith("data-") ||
                ["href", "src", "alt", "title", "type", "name", "value", "role"].includes(name)
            ) {
                attrs[name] = value;
            }
        }
        return attrs;
    }

    // Ein „Hint“-Selector, nicht perfekt, aber hilfreich (nicht 100% eindeutig garantiert)
    function buildSelectorHint(el) {
        try {
            if (el.id) return `#${CSS.escape(el.id)}`;

            const parts = [];
            let node = el;
            let depth = 0;

            while (node && node.nodeType === 1 && depth < 4) {
                const tag = node.tagName.toLowerCase();
                let part = tag;

                const classList = Array.from(node.classList || [])
                    .filter((c) => c && !INTERNAL_CLASSES.includes(c))
                    .slice(0, 2);

                if (classList.length) {
                    part += "." + classList.map((c) => CSS.escape(c)).join(".");
                }

                // nth-of-type als grober Stabilisator
                const parent = node.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(
                        (c) => c.tagName === node.tagName
                    );
                    if (siblings.length > 1) {
                        const index = siblings.indexOf(node) + 1;
                        part += `:nth-of-type(${index})`;
                    }
                }

                parts.unshift(part);
                node = parent;
                depth++;
            }

            return parts.join(" > ");
        } catch {
            return null;
        }
    }

    function pickComputedStyles(computed) {
        // Erweiterter Style-Snapshot (bewusst kuratiert, nicht ALLES)
        return {
            // Layout / Box
            display: computed.display,
            position: computed.position,
            top: computed.top,
            right: computed.right,
            bottom: computed.bottom,
            left: computed.left,
            zIndex: computed.zIndex,
            width: computed.width,
            height: computed.height,
            boxSizing: computed.boxSizing,
            overflow: computed.overflow,
            overflowX: computed.overflowX,
            overflowY: computed.overflowY,

            // Spacing
            margin: computed.margin,
            marginTop: computed.marginTop,
            marginRight: computed.marginRight,
            marginBottom: computed.marginBottom,
            marginLeft: computed.marginLeft,

            padding: computed.padding,
            paddingTop: computed.paddingTop,
            paddingRight: computed.paddingRight,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,

            // Typography
            color: computed.color,
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            textAlign: computed.textAlign,
            textTransform: computed.textTransform,
            textDecoration: computed.textDecorationLine,
            whiteSpace: computed.whiteSpace,

            // Flex / Grid (nur relevant, wenn display passt – aber harmless)
            flexDirection: computed.flexDirection,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems,
            gap: computed.gap,
            rowGap: computed.rowGap,
            columnGap: computed.columnGap,

            gridTemplateColumns: computed.gridTemplateColumns,
            gridTemplateRows: computed.gridTemplateRows,
            gridColumn: computed.gridColumn,
            gridRow: computed.gridRow,

            // Visual
            backgroundColor: computed.backgroundColor,
            backgroundImage: computed.backgroundImage,
            backgroundSize: computed.backgroundSize,
            backgroundPosition: computed.backgroundPosition,
            backgroundRepeat: computed.backgroundRepeat,
            border: computed.border,
            borderTop: computed.borderTop,
            borderRight: computed.borderRight,
            borderBottom: computed.borderBottom,
            borderLeft: computed.borderLeft,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow,
            opacity: computed.opacity,
            transform: computed.transform,
            cursor: computed.cursor,

            // Useful extras
            transition: computed.transition,
        };
    }

    function snapshotStyles(el) {
        const computed = window.getComputedStyle(el);
        return sanitizeStyleSnapshot(pickComputedStyles(computed));
    }


    // Fokus-Snapshot als Annäherung an :focus (falls möglich)
    function snapshotFocusStyles(el) {
        try {
            const previouslyFocused = document.activeElement;
            const canFocus =
                typeof el.focus === "function" &&
                (el.tabIndex >= 0 ||
                    ["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

            if (!canFocus) return null;

            el.focus({ preventScroll: true });
            const focused = snapshotStyles(el);

            // restore focus
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                previouslyFocused.focus({ preventScroll: true });
            } else {
                el.blur?.();
            }

            return focused;
        } catch {
            return null;
        }
    }

    function buildElementPayload(element, extra = {}) {
        const rect = element.getBoundingClientRect();

        // Klassen ohne interne
        const allClasses = element.className
            ? element.className.split(/\s+/).filter(Boolean)
            : [];
        const classes = allClasses.filter((cls) => !INTERNAL_CLASSES.includes(cls));

        // outerHTML bereinigen
        const clone = element.cloneNode(true);
        INTERNAL_CLASSES.forEach((cls) => clone.classList.remove(cls));
        const wrapper = document.createElement("div");
        wrapper.appendChild(clone);
        const cleanOuterHTML = wrapper.innerHTML;

        const payload = {
            version: "poc01.v2",
            capturedAt: new Date().toISOString(),

            tagName: element.tagName,
            id: element.id || null,
            classes,
            attributes: extractAttributes(element),
            innerText: element.innerText?.trim() || null,
            outerHTML: cleanOuterHTML,

            // Selector / Position
            selectorHint: buildSelectorHint(element),
            boundingClientRect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
            },

            // Styles
            styles: snapshotStyles(element),

            // Kontext (Parent)
            parent: element.parentElement
                ? {
                    tagName: element.parentElement.tagName,
                    classes: element.parentElement.className
                        ? element.parentElement.className.split(/\s+/).filter(Boolean)
                        : [],
                }
                : null,

            // Optional: State-Snapshots
            states: {
                hover: extra.hoverStyles || null,
                focus: extra.focusStyles || null,
            },
        };

        return payload;
    }

    // Hover Highlight
    function handleMouseOver(event) {
        if (!selectionMode) return;

        const target = event.target;
        if (target === currentHoverElement || target === selectedElement) return;

        clearHover();
        currentHoverElement = target;
        currentHoverElement.classList.add("hover-outline");
    }

    // Click Select
    function handleClick(event) {
        if (!selectionMode) return;

        event.preventDefault();
        event.stopPropagation();

        clearHover();
        clearSelected();

        selectedElement = event.target;

        const hoverStyles = snapshotStyles(selectedElement);
        const focusStyles = snapshotFocusStyles(selectedElement);

        const payload = buildElementPayload(selectedElement, { hoverStyles, focusStyles });

        selectedElement.classList.add("selected-outline");

        console.log("Selektiertes Element-Payload:", payload);

        chrome.storage.local.set({ lastSelection: payload }, () => {
            console.log("Payload gespeichert.");
        });

        selectionMode = false;
    }


    // Messages from Popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message?.type) return;

        if (message.type === "START_SELECTION") {
            setSelectionMode(true);
            console.log("Select Mode: ON");
            sendResponse({ ok: true, selectionMode });
            return;
        }

        if (message.type === "STOP_SELECTION") {
            setSelectionMode(false);
            console.log("Select Mode: OFF");
            sendResponse({ ok: true, selectionMode });
            return;
        }

        if (message.type === "GET_SELECTION_STATE") {
            sendResponse({ ok: true, selectionMode });
            return;
        }
    });

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleClick, true);
})();
