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

export function splitForShade(xs, ys, xCut, rel) {
  const x = [];
  const y = [];
  for (let i = 0; i < xs.length; i++) {
    const ok = rel === "le" ? xs[i] <= xCut : xs[i] >= xCut;
    if (ok) {
      x.push(xs[i]);
      y.push(ys[i]);
    }
  }
  return { x, y };
}

export function updatePlotHighlight({ currentXValues, currentYValues, xInput, relSelect }) {
  if (!currentXValues.length || !currentYValues.length) return;

  const x0 = parseFloat(xInput.value);
  const rel = relSelect.value;

  Plotly.relayout("plot", { shapes: [] });

  if (!Number.isFinite(x0) || rel === "eq") {
    Plotly.restyle("plot", { x: [[]], y: [[]] }, [1]);
    return;
  }

  const shaded = splitForShade(currentXValues, currentYValues, x0, rel);
  Plotly.restyle("plot", { x: [shaded.x], y: [shaded.y] }, [1]);
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