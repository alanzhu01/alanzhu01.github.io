export function hideOutputs({ plotEl, statsCol, pxOutput, xInput }) {
  plotEl.classList.remove("visible");
  plotEl.style.display = "none";
  statsCol.classList.add("hidden");
  pxOutput.value = "";
  xInput.value = "";
}

export function showPlotContainer({ plotEl }) {
  if (plotEl.style.display !== "block") {
    plotEl.style.display = "block";
    requestAnimationFrame(() => plotEl.classList.add("visible"));
  }
}

export function showOutputs({ plotEl, statsCol }) {
  showPlotContainer({ plotEl });
  statsCol.classList.remove("hidden");
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function roundInt(value, min, max) {
  if (!Number.isFinite(value)) return null;
  return clamp(Math.round(value), min, max);
}

export function onBlurOrEnter(el, fn) {
  el.addEventListener("blur", fn);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") el.blur();
  });
}

export function barColors(xs, x, rel) {
  return xs.map(k => {
    if (
      (rel === "eq" && k === x) ||
      (rel === "le" && k <= x) ||
      (rel === "ge" && k >= x)
    ) {
      return cssVar("--plot-red-bar");
    }
    return cssVar("--plot-blue-bar");
  });
}

export function updatePlotHighlight({ currentXValues, xInput, relSelect }) {
  if (!currentXValues.length) return;

  const x = parseInt(xInput.value, 10);
  const rel = relSelect.value;

  Plotly.restyle("plot", {
    "marker.color": [barColors(currentXValues, x, rel)]
  });
}

export function setMath(id, latex) {
  const el = document.getElementById(id);
  el.textContent = `\\(${latex}\\)`;
  return el;
}

export async function typesetNodes(nodes) {
  if (window.MathJax?.typesetPromise) {
    await MathJax.typesetPromise(nodes);
  }
}

export function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}