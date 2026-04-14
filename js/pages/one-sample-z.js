import * as Utils from '../utils/hypothesis-test.js';
import * as ZTest from "../math/one-sample-z.js";

const xbarInput = document.getElementById("xbar");
const sigmaInput = document.getElementById("s");
const nInput = document.getElementById("n");
const alphaInput = document.getElementById("a");
const mu0Input = document.getElementById("mu0");
const h1Input = document.getElementById("h1");
const altSelect = document.getElementById("h1-type");

const statsCol = document.getElementById("stats-col");
const plotEl = document.getElementById("plot");
const formulaToggle = document.getElementById("formula-toggle");

async function updateStats(xbar, sigma, n, mu0, alt) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  const data = ZTest.oneSampleZStats(xbar, sigma, n, mu0, alt, alpha, formula);

  const zNode = Utils.setMath("z-stat", data.z_stat);
  const pNode = Utils.setMath("p-value", data.p_value);
  const critNode = Utils.setMath("crit-value", data.crit_value);
  const decisionNode = Utils.setMath("decision", data.decision);
  const critRuleNode = Utils.setMath("crit-rule", data.crit_rule);
  const pRuleNode = Utils.setMath("p-rule", data.p_rule);

  await Utils.typesetNodes([
    zNode,
    pNode,
    critNode,
    decisionNode,
    critRuleNode,
    pRuleNode
  ]);
}

function validInputs() {
  const xbar = parseFloat(xbarInput.value);
  const sigma = parseFloat(sigmaInput.value);
  const n = parseInt(nInput.value);
  const mu0 = parseFloat(mu0Input.value);

  return (
    Number.isFinite(xbar) &&
    Number.isFinite(sigma) &&
    Number.isFinite(n) &&
    Number.isFinite(mu0) &&
    sigma > 0 &&
    n > 0
  );
}

async function maybeGeneratePlot() {
  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  const xbar = parseFloat(xbarInput.value);
  const sigma = parseFloat(sigmaInput.value);
  const n = parseInt(nInput.value);
  const mu0 = parseFloat(mu0Input.value);
  const alt = altSelect.value;

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(xbar, sigma, n, mu0, alt);

  const data = ZTest.oneSampleZData(xbar, sigma, n, mu0, alt);

  const z = data.z;

  Plotly.react(
    "plot",
    [
      {
        x: data.x,
        y: data.y,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-blue-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-blue-fill"),
        hoverinfo: "skip"
      },
      {
        x: data.shade_x_left,
        y: data.shade_y_left,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-red-fill"),
        hoverinfo: "skip"
      },
      {
        x: data.shade_x_right,
        y: data.shade_y_right,
        type: "scatter",
        mode: "lines",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: Utils.cssVar("--plot-red-fill"),
        hoverinfo: "skip"
      }
    ],
    {
      title: null,
      showlegend: false,
      hovermode: false,
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: {
        title: "z",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main"),
        zeroline: false
      },
      yaxis: {
        title: "\u03C6(z)",
        showgrid: false,
        fixedrange: true,
        color: Utils.cssVar("--text-main"),
        linecolor: Utils.cssVar("--text-main"),
        tickcolor: Utils.cssVar("--text-main")
      },
      shapes: [
        {
          type: "line",
          x0: z,
          x1: z,
          y0: 0,
          y1: 0.42,
          line: {
            color: Utils.cssVar("--plot-red-bar"),
            width: 2,
            dash: "dash"
          }
        }
      ],
      annotations: [
        {
          x: z,
          y: 0.43,
          text: `z = ${z}`,
          showarrow: false,
          font: { color: Utils.cssVar("--text-main") }
        }
      ],
      margin: {
        t: 50,
        l: 80,
        r: 40,
        b: 80
      }
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

[
  xbarInput,
  sigmaInput,
  nInput,
  alphaInput,
  mu0Input
].forEach(input => {
  Utils.onBlurOrEnter(input, maybeGeneratePlot);
});

altSelect.addEventListener("change", maybeGeneratePlot);

window.addEventListener("load", () => {
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise();
  }
});

document.addEventListener("themechange", maybeGeneratePlot);

formulaToggle.addEventListener("change", maybeGeneratePlot);

let syncing = false;

function syncInputs(source, target) {
  if (syncing) return;
  syncing = true;

  target.value = source.value;

  syncing = false;
}

Utils.onBlurOrEnter(mu0Input, () => {
  syncInputs(mu0Input, h1Input);
});

Utils.onBlurOrEnter(h1Input, () => {
  syncInputs(h1Input, mu0Input);
});