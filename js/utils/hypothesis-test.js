export function hideOutputs({ plotEl, statsCol }) {
  if (plotEl) {
    plotEl.classList.remove("visible");
    plotEl.style.display = "none";
  }

  if (statsCol) {
    statsCol.classList.add("hidden");
  }
}

export function showPlotContainer({ plotEl }) {
  if (!plotEl) return;

  if (plotEl.style.display !== "block") {
    plotEl.style.display = "block";
    requestAnimationFrame(() => plotEl.classList.add("visible"));
  }
}

export function showOutputs({ plotEl, statsCol }) {
  showPlotContainer({ plotEl });

  if (statsCol) {
    statsCol.classList.remove("hidden");
  }
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function roundInt(value, min, max) {
  if (!Number.isFinite(value)) return null;
  return clamp(Math.round(value), min, max);
}

export function onBlurOrEnter(el, fn) {
  if (!el) return;

  el.addEventListener("blur", fn);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") el.blur();
  });
}

export function setMath(id, latex) {
  const el = document.getElementById(id);

  if (!el) {
    console.error(`Missing element with id="${id}"`);
    return null;
  }

  el.textContent = `\\(${latex}\\)`;
  return el;
}

export async function typesetNodes(nodes) {
  const validNodes = nodes.filter(Boolean);

  if (window.MathJax?.typesetPromise && validNodes.length) {
    await MathJax.typesetPromise(validNodes);
  }
}