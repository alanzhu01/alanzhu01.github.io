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
const decisionBox = document.getElementById("decision-box");

const rawDataBtn = document.getElementById("raw-data-btn");
const rawDataModal = document.getElementById("raw-data-modal");
const rawDataInput = document.getElementById("raw-data-input");
const rawDataSubmit = document.getElementById("raw-data-submit");
const rawDataCancel = document.getElementById("raw-data-cancel");
const rawDataError = document.getElementById("raw-data-error");

async function updateStats(xbar, sigma, n, mu0, alt) {
  const formula = formulaToggle.checked ? 1 : 0;
  const alpha = parseFloat(alphaInput.value);

  if (hypothesisMode === "simple") {
    const mu1 = parseFloat(h1Input.value);

    const data = ZTest.oneSampleZSimpleStats(
      xbar,
      sigma,
      n,
      mu0,
      mu1,
      alpha,
      formula
    );

    const zNode = Utils.setMath("z-stat", data.likelihood_ratio);
    const pNode = Utils.setMath("p-value", data.power);
    const critNode = Utils.setMath("crit-value", data.xbar_cutoff);
    const decisionNode = Utils.setMath("decision", data.decision);
    const critRuleNode = Utils.setMath("crit-rule", data.lr_rule);
    const pRuleNode = Utils.setMath("p-rule", data.xbar_cutoff_rule);

    await Utils.typesetNodes([
      zNode,
      pNode,
      critNode,
      decisionNode,
      critRuleNode,
      pRuleNode
    ]);

    return;
  }

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
  function regionAnchor(xValues, yValues) {
    const pts = xValues
      .map((x, i) => ({ x, y: yValues[i] }))
      .filter(p => p.y !== null && Number.isFinite(p.y) && p.y > 0);

    if (pts.length === 0) return null;

    const totalWeight = pts.reduce((sum, p) => sum + p.y, 0);

    const weightedX =
      pts.reduce((sum, p) => sum + p.x * p.y, 0) / totalWeight;

    const closest = pts.reduce((best, p) =>
      Math.abs(p.x - weightedX) < Math.abs(best.x - weightedX) ? p : best
    );

    return {
      x: closest.x,
      y: closest.y * 0.4
    };
  }

  function labelAnnotation(anchor, text, color, side = "right") {
    if (!anchor) return null;

    return {
      x: anchor.x,
      y: anchor.y,
      text,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: color,
      font: {
        size: 22,
        color
      },

      ax: side === "right" ? 45 : -45,
      ay: -45
    };
  }

  if (!validInputs()) {
    Utils.hideOutputs({ plotEl, statsCol });
    return;
  }

  const xbar = parseFloat(xbarInput.value);
  const sigma = parseFloat(sigmaInput.value);
  const n = parseInt(nInput.value);
  const mu0 = parseFloat(mu0Input.value);
  const alt = altSelect.value;

  let xValues = [];
  let alphaY = [];
  let betaY = [];

  let direction, cutoff, se;
  let nullY = [];
  let altY = [];

  Utils.showOutputs({ plotEl, statsCol });
  await updateStats(xbar, sigma, n, mu0, alt);

  const data = ZTest.oneSampleZData(xbar, sigma, n, mu0, alt);
  const traces = [
    {
      x: data.x,
      y: data.y,
      type: "scatter",
      mode: "lines",
      name: "Null",
      line: { color: Utils.cssVar("--plot-blue-bar"), width: 3 },
      fill: "tozeroy",
      fillcolor: Utils.cssVar("--plot-blue-fill"),
      hoverinfo: "skip"
    }
  ];

  if (hypothesisMode === "simple") {
    const altMu = parseFloat(h1Input.value);
    const alpha = parseFloat(alphaInput.value);
    se = sigma / Math.sqrt(n);

    direction = altMu > mu0 ? "right" : "left";

    cutoff =
      direction === "right"
        ? mu0 + jStat.normal.inv(1 - alpha, 0, 1) * se
        : mu0 + jStat.normal.inv(alpha, 0, 1) * se;

    const minX = Math.min(mu0, altMu, cutoff) - 4 * se;
    const maxX = Math.max(mu0, altMu, cutoff) + 4 * se;

    xValues = [];
    nullY = [];
    altY = [];
    alphaY = [];
    betaY = [];

    const steps = 400;

    for (let i = 0; i <= steps; i++) {
      const x = minX + (maxX - minX) * (i / steps);

      const y0 = jStat.normal.pdf(x, mu0, se);
      const y1 = jStat.normal.pdf(x, altMu, se);

      const inAlpha =
        direction === "right"
          ? x >= cutoff
          : x <= cutoff;

      const inBeta =
        direction === "right"
          ? x < cutoff
          : x > cutoff;

      xValues.push(x);
      nullY.push(y0);
      altY.push(y1);
      alphaY.push(inAlpha ? y0 : null);
      betaY.push(inBeta ? y1 : null);
    }

    traces.length = 0;

    traces.push(
      {
        x: xValues,
        y: nullY,
        type: "scatter",
        mode: "lines",
        name: "Null Distribution",
        line: { color: Utils.cssVar("--plot-blue-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: "rgba(80, 130, 220, 0.18)",
        hoverinfo: "skip"
      },
      {
        x: xValues,
        y: altY,
        type: "scatter",
        mode: "lines",
        name: "Alternative Distribution",
        line: { color: Utils.cssVar("--plot-red-bar"), width: 3 },
        fill: "tozeroy",
        fillcolor: "rgba(220, 90, 90, 0.18)",
        hoverinfo: "skip"
      },
      {
        x: xValues,
        y: alphaY,
        type: "scatter",
        mode: "lines",
        name: "α",
        line: { color: "rgba(0,0,0,0)" },
        fill: "tozeroy",
        fillcolor: "rgba(20, 60, 150, 0.4)",
        hoverinfo: "skip"
      },
      {
        x: xValues,
        y: betaY,
        type: "scatter",
        mode: "lines",
        name: "β",
        line: { color: "rgba(0,0,0,0)" },
        fill: "tozeroy",
        fillcolor: "rgba(150, 35, 35, 0.4)",
        hoverinfo: "skip"
      }
    );
  } else {
    traces.push(
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
    );
  }

  let nullLabelX, altLabelX;

  if (hypothesisMode === "simple") {
    const nullPeakX = mu0;
    const altPeakX = parseFloat(h1Input.value);

    const minGap = Math.max(se * 1.6, 0.8);

    nullLabelX = nullPeakX;
    altLabelX = altPeakX;

    if (Math.abs(altLabelX - nullLabelX) < minGap) {
      const midpoint = (nullLabelX + altLabelX) / 2;

      if (altPeakX > nullPeakX) {
        nullLabelX = midpoint - minGap / 2;
        altLabelX = midpoint + minGap / 2;
      } else {
        altLabelX = midpoint - minGap / 2;
        nullLabelX = midpoint + minGap / 2;
      }
    }
  }

  const z = data.z;

  Plotly.react(
    "plot",
    traces,
    {
      title: null,
      showlegend: false,
      hovermode: false,
      paper_bgcolor: Utils.cssVar("--plot-bgcolor"),
      plot_bgcolor: Utils.cssVar("--plot-bgcolor"),
      xaxis: {
        title: hypothesisMode === "simple" ? "x̄" : "z",
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
      annotations: hypothesisMode === "simple"
        ? [
            {
              x: nullLabelX,
              y: Math.max(...nullY) * 1.08,
              text: "Null",
              showarrow: false,
              font: {
                size: 16,
                color: Utils.cssVar("--plot-blue-bar")
              }
            },
            {
              x: altLabelX,
              y: Math.max(...altY) * 1.08,
              text: "Alternative",
              showarrow: false,
              font: {
                size: 16,
                color: Utils.cssVar("--plot-red-bar")
              }
            },

            labelAnnotation(
              regionAnchor(xValues, alphaY),
              "α",
              "rgba(20,60,150,1)",
              direction === "right" ? "right" : "left"
            ),

            labelAnnotation(
              regionAnchor(xValues, betaY),
              "β",
              "rgba(150,35,35,1)",
              direction === "right" ? "left" : "right"
            )
          ].filter(Boolean)
        : [],
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
  mu0Input,
  h1Input
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
  if (hypothesisMode === "composite") {
    syncInputs(mu0Input, h1Input);
    maybeGeneratePlot();
  }
});

Utils.onBlurOrEnter(h1Input, () => {
  if (hypothesisMode === "composite") {
    syncInputs(h1Input, mu0Input);
    maybeGeneratePlot();
  }
});

function hideDecision() {
  decisionBox.classList.add("masked");
  decisionBox.classList.remove("revealed");
}

function revealDecision() {
  decisionBox.classList.remove("masked");
  decisionBox.classList.add("revealed");
}

decisionBox.addEventListener("click", () => {
  if (decisionBox.classList.contains("masked")) {
    revealDecision();
  } else {
    hideDecision();
  }
});

[
  xbarInput,
  sigmaInput,
  nInput,
  alphaInput,
  mu0Input,
  h1Input
].forEach(input => {
  Utils.onBlurOrEnter(input, hideDecision);
});

altSelect.addEventListener("change", hideDecision);

function openRawDataModal() {
  rawDataModal.classList.remove("hidden");
  rawDataModal.setAttribute("aria-hidden", "false");
  rawDataError.textContent = "";
  rawDataInput.focus();
}

function closeRawDataModal() {
  rawDataModal.classList.add("hidden");
  rawDataModal.setAttribute("aria-hidden", "true");
  rawDataError.textContent = "";
}

function parseRawData(text) {
  return text
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(Number);
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStdDev(values) {
  if (values.length < 2) return 0;

  const xbar = mean(values);
  const ss = values.reduce((sum, v) => sum + (v - xbar) ** 2, 0);
  return Math.sqrt(ss / (values.length));
}

async function applyRawData() {
  const values = parseRawData(rawDataInput.value);

  if (values.length === 0) {
    rawDataError.textContent = "Please enter at least one number.";
    return;
  }

  if (values.some(v => !Number.isFinite(v))) {
    rawDataError.textContent = "Please enter only numbers separated by commas.";
    return;
  }

  const n = values.length;
  const xbar = mean(values);
  const sigma = sampleStdDev(values);

  xbarInput.value = xbar;
  sigmaInput.value = sigma;
  nInput.value = n;

  closeRawDataModal();
  hideDecision();
  await maybeGeneratePlot();
}

rawDataBtn.addEventListener("click", openRawDataModal);
rawDataCancel.addEventListener("click", closeRawDataModal);
rawDataSubmit.addEventListener("click", applyRawData);

rawDataInput.addEventListener("keydown", async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    await applyRawData();
  }

  if (e.key === "Escape") {
    closeRawDataModal();
  }
});

rawDataModal.addEventListener("click", (e) => {
  if (e.target === rawDataModal) {
    closeRawDataModal();
  }
});

const hypothesisTabs = document.querySelectorAll(".hypothesis-tab");
const h1Equals = document.getElementById("h1-equals");

let hypothesisMode = "composite";
let lastCompositeAlt = altSelect.value || "neq";

altSelect.addEventListener("change", () => {
  if (hypothesisMode === "composite") {
    lastCompositeAlt = altSelect.value;
  }
});

hypothesisTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    hypothesisTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const newMode = tab.dataset.mode;

    if (newMode === "simple") {
      if (hypothesisMode === "composite") {
        lastCompositeAlt = altSelect.value;
      }

      hypothesisMode = "simple";

      altSelect.style.display = "none";
      h1Equals.style.display = "inline-flex";
      altSelect.value = "eq";
    } else {
      hypothesisMode = "composite";

      altSelect.style.display = "";
      h1Equals.style.display = "none";
      altSelect.value = lastCompositeAlt;
    }

    updateStatLabels();
    maybeGeneratePlot();
  });
});

const labelStat = document.getElementById("label-stat");
const labelP = document.getElementById("label-p");
const labelCrit = document.getElementById("label-crit");
const labelCritRule = document.getElementById("label-crit-rule");
const labelPRule = document.getElementById("label-p-rule");

function updateStatLabels() {
  if (hypothesisMode === "simple") {
    labelStat.textContent = "Likelihood Ratio";
    labelP.textContent = "Power";
    labelCrit.textContent = "Cutoff";
    labelCritRule.textContent = "Likelihood Ratio Rule";
    labelPRule.textContent = "Cutoff Rule";
  } else {
    labelStat.textContent = "Test Statistic";
    labelP.textContent = "P-Value";
    labelCrit.textContent = "Critical Value";
    labelCritRule.textContent = "Critical Value Rule";
    labelPRule.textContent = "P-Value Rule";
  }
}