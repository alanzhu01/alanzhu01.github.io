import * as Utils from '../utils/discrete.js';
import * as Geometric from "../math/geometric.js";

const pInput = document.getElementById("p");
const xInput = document.getElementById("x");
const relSelect = document.getElementById("rel");
const pxOutput = document.getElementById("px");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

let currentXValues = [];

async function updateStats(p) {
  const formula = formulaToggle.checked ? 1 : 0;
  const data = Geometric.geometricStats(p, formula);

  const meanNode = Utils.setMath("mean", data.mean);
  const varNode  = Utils.setMath("var", data.variance);
  const sdNode   = Utils.setMath("sd", data.sd);

  const pmfNode = Utils.setMath("pmf", data.pmf_latex);
  const mgfNode = Utils.setMath("mgf", data.mgf_latex);

  await Utils.typesetNodes([meanNode, varNode, sdNode, pmfNode, mgfNode]);
}

function normalizeP() {
  if (pInput.value.trim() === "") return false;

  const raw = Number(pInput.value);
  if (!Number.isFinite(raw)) return false;

  const p = Utils.clamp(raw, 0, 1);
  pInput.value = p;

  return true;
}

function normalizeX() {
  if (xInput.value.trim() === "") return false;

  const raw = Number(xInput.value);

  if (!Number.isFinite(raw)) return false;

  const x = Utils.roundInt(raw, 0, Infinity);
  xInput.value = x;
  return true;
}

function normalizePX() {
  if (pxOutput.value.trim() === "") return false;

  const raw = Number(pxOutput.value);
  if (!Number.isFinite(raw)) return false;

  const px = Utils.clamp(raw, 0, 1);
  pxOutput.value = px;
  return true;
}

async function maybeUpdatePX() {
  const p = parseFloat(pInput.value);
  const x = parseInt(xInput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(p) || !Number.isFinite(x) || p === 0 || p === 1) {
    pxOutput.value = "";
    return;
  }

  const data = Geometric.geometricProb(p, x, rel);
  pxOutput.value = data.prob;
}

async function maybeUpdateX() {
  const p = parseFloat(pInput.value);
  const px = parseFloat(pxOutput.value, 10);
  const rel = relSelect.value;

  if (!Number.isFinite(p) || !Number.isFinite(px) || p === 0 || p === 1) {
    xInput.value = "";
    return;
  }

  const data = Geometric.geometricInverse(p, px, rel);
  xInput.value = data.x;
  return data.x;
}

async function maybeGeneratePlot() {
  const p = parseFloat(pInput.value);

  if (!Number.isFinite(p) || p === 0 || p === 1) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(p);

  const data = Geometric.geometricData(p);
  currentXValues = data.x;

  Plotly.react(
    "plot", 
    [
      {
        x: data.x,
        y: data.y,
        type: "bar",
        marker: {
          color: Utils.barColors(
            data.x,
            parseInt(xInput.value, 10),
            relSelect.value
            )
        },
        hovertemplate: "P(X=%{x}) = %{y:.6f}<extra></extra>"
      }
    ], 
    {
      title: null,
      hovermode: "closest",
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      hoverlabel: {
        bgcolor: Utils.cssVar("--header-bg"),
        bordercolor: Utils.cssVar("--plot-bordercolor"),
        font: { color: Utils.cssVar("--text-main"), size: 14 },
        align: "left"
      },
      xaxis: { 
        title: "x",
        showgrid: false,
        fixedrange: true,

        tickmode: "auto",
        dtick: 1,
        tickformat: "d",
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      yaxis: { 
        title: "P(X = x)",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      margin: {
        t: 50,
        l: 80,
        r: 80,
        b: 80
      },
    },
    {
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      dragmode: false,
      showAxisDragHandles: false,
      showAxisRangeEntryBoxes: false
    }
  );
}

Utils.onBlurOrEnter(pInput, () => {
  if (!normalizeP()) {
    Utils.hideOutputs({ plotEl, statsCol, pxOutput, xInput });
    return;
  }

  maybeGeneratePlot();
  maybeUpdatePX();
});

Utils.onBlurOrEnter(xInput, () => {
  if (!normalizeX()) {
    pxOutput.value = "";
    return;
  }

  maybeUpdatePX();
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect });
});

Utils.onBlurOrEnter(pxOutput, async () => {
  if (!normalizePX()) {
    xInput.value = "";
    return;
  }

  if (relSelect.value === "eq") {
    relSelect.value = "le";
  }

  const x = await maybeUpdateX();
  if (Number.isFinite(x)) {
    await maybeUpdatePX();
  }
  
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect });
});

relSelect.addEventListener("change", () => { 
  maybeUpdatePX(); 
  Utils.updatePlotHighlight({ currentXValues, xInput, relSelect }); 
});

window.addEventListener("load", () => {
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", () => { 
  maybeGeneratePlot(); 
});

formulaToggle.addEventListener("change", () => {
  const p = parseFloat(pInput.value);
  if (Number.isFinite(p)) updateStats(p);
});