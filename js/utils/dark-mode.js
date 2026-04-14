const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");
const label = toggle.querySelector("span");

const saved = localStorage.getItem("theme");
if (saved) {
  root.setAttribute("data-theme", saved);
  if (saved === "dark") {
    label.textContent = "Light Mode";
  }
}

toggle.addEventListener("click", () => {
  const isDark = root.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";

  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);

  label.textContent = isDark ? "Dark Mode" : "Light Mode";
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
});