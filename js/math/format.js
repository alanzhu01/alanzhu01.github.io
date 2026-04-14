export function fmt(value) {
  return Number(value).toFixed(6).replace(/\.?0+$/, "");
}