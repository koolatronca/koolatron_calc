const display = document.getElementById("display");
const historyBox = document.getElementById("history");
let angle = "DEG";
let shift = false;
let ans = 0;
let solved = false;

function val(){ return display.value; }
function setVal(v){ display.value = v || "0"; display.scrollLeft = display.scrollWidth; }
function isEndValue(s){ return /[0-9.)πe!]$/.test(s); }

function press(x){
  let v = val();
  if (solved && /[0-9.(πe]/.test(x)) { v = ""; solved = false; }
  if (v === "0" || v === "Error") v = "";
  if ((x === "(" || x === "π" || x === "e") && isEndValue(v)) v += "×";
  setVal(v + x);
}

function op(x){
  solved = false;
  let symbol = x === "*" ? "×" : x === "/" ? "÷" : x;
  let v = val();
  if (v === "Error") v = "0";
  if (/[+\-×÷^%]$/.test(v)) v = v.slice(0, -1);
  setVal(v + symbol);
}

function clearAll(){ setVal("0"); solved = false; }
function backspace(){
  if (val() === "Error" || val().length <= 1 || solved) { clearAll(); return; }
  setVal(val().slice(0, -1));
}
function useAns(){ press(String(ans)); }

function toggleAngle(){
  angle = angle === "DEG" ? "RAD" : "DEG";
  document.getElementById("angleBtn").textContent = angle;
}

function toggleShift(){
  shift = !shift;
  document.getElementById("shiftBtn").classList.toggle("active", shift);
  document.getElementById("sinBtn").textContent = shift ? "sin⁻¹" : "sin";
  document.getElementById("cosBtn").textContent = shift ? "cos⁻¹" : "cos";
  document.getElementById("tanBtn").textContent = shift ? "tan⁻¹" : "tan";
  document.getElementById("sinBtn").classList.toggle("shift", shift);
  document.getElementById("cosBtn").classList.toggle("shift", shift);
  document.getElementById("tanBtn").classList.toggle("shift", shift);
}

function trig(name){
  wrap(shift ? "a" + name : name);
  if (shift) toggleShift();
}

function lastPart(v){
  let depth = 0;
  for (let i = v.length - 1; i >= 0; i--){
    const c = v[i];
    if (c === ")") depth++;
    if (c === "(") depth--;
    if (depth === 0 && i > 0 && /[+\-×÷^]/.test(c)){
      return { before: v.slice(0, i + 1), part: v.slice(i + 1) };
    }
  }
  return { before: "", part: v };
}

function wrap(fn){
  let v = val();
  if (v === "0" || v === "Error" || v === "" || /[+\-×÷^(]$/.test(v)){
    setVal((v === "0" || v === "Error" ? "" : v) + fn + "(");
    solved = false;
    return;
  }
  const last = lastPart(v);
  setVal(last.before + fn + "(" + last.part + ")");
  solved = false;
}

function square(){
  let v = val();
  if (v === "0" || v === "Error" || /[+\-×÷^(]$/.test(v)) return;
  const last = lastPart(v);
  setVal(last.before + "(" + last.part + ")²");
}

function power(){
  let v = val();
  if (v === "0" || v === "Error" || /[+\-×÷^(]$/.test(v)) { op("^"); return; }
  const last = lastPart(v);
  setVal(last.before + "(" + last.part + ")^");
}

function fact(){
  let v = val();
  if (v === "0" || v === "Error" || /[+\-×÷^(]$/.test(v)) return;
  const last = lastPart(v);
  setVal(last.before + "(" + last.part + ")!");
}

function factorial(n){
  if (n < 0 || !Number.isInteger(n)) throw new Error("factorial");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function closeBrackets(s){
  let open = 0;
  for (const c of s){
    if (c === "(") open++;
    if (c === ")") open--;
  }
  while (open > 0){ s += ")"; open--; }
  return s;
}

function multiplyInsert(s){
  return s
    .replace(/(\d|\)|π|e)(sin|cos|tan|asin|acos|atan|sqrt|log|ln|abs)/g, "$1×$2")
    .replace(/(\d|\)|π|e)\(/g, "$1×(")
    .replace(/\)(\d|π|e)/g, ")×$1")
    .replace(/(π|e)(\d)/g, "$1×$2");
}

function toJS(s){
  s = closeBrackets(s);
  s = multiplyInsert(s);
  s = s.replace(/×/g, "*").replace(/÷/g, "/");
  s = s.replace(/π/g, "Math.PI").replace(/\be\b/g, "Math.E");
  s = s.replace(/\^/g, "**").replace(/²/g, "**2");
  s = s.replace(/(\([^()]*\)|\d+(\.\d+)?)!/g, "factorial($1)");

  if (angle === "DEG"){
    s = s.replace(/asin\(/g, "asinDeg(").replace(/acos\(/g, "acosDeg(").replace(/atan\(/g, "atanDeg(");
    s = s.replace(/sin\(/g, "sinDeg(").replace(/cos\(/g, "cosDeg(").replace(/tan\(/g, "tanDeg(");
  } else {
    s = s.replace(/asin\(/g, "Math.asin(").replace(/acos\(/g, "Math.acos(").replace(/atan\(/g, "Math.atan(");
    s = s.replace(/sin\(/g, "Math.sin(").replace(/cos\(/g, "Math.cos(").replace(/tan\(/g, "Math.tan(");
  }

  s = s.replace(/sqrt\(/g, "Math.sqrt(");
  s = s.replace(/log\(/g, "Math.log10(");
  s = s.replace(/ln\(/g, "Math.log(");
  s = s.replace(/abs\(/g, "Math.abs(");
  return s;
}

function sinDeg(x){ return Math.sin(x * Math.PI / 180); }
function cosDeg(x){ return Math.cos(x * Math.PI / 180); }
function tanDeg(x){ return Math.tan(x * Math.PI / 180); }
function asinDeg(x){ return Math.asin(x) * 180 / Math.PI; }
function acosDeg(x){ return Math.acos(x) * 180 / Math.PI; }
function atanDeg(x){ return Math.atan(x) * 180 / Math.PI; }

function calculate(){
  try {
    const raw = val();
    const js = toJS(raw);
    const result = Function(
      "factorial","sinDeg","cosDeg","tanDeg","asinDeg","acosDeg","atanDeg",
      '"use strict"; return (' + js + ')'
    )(factorial, sinDeg, cosDeg, tanDeg, asinDeg, acosDeg, atanDeg);

    if (!Number.isFinite(result)) throw new Error("result");
    const clean = Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
    historyBox.value += raw + " = " + clean + "\\n";
    historyBox.scrollTop = historyBox.scrollHeight;
    ans = clean;
    setVal(clean);
    solved = true;
  } catch(e) {
    setVal("Error");
    solved = true;
  }
}

document.addEventListener("keydown", e => {
  const k = e.key;
  if (/[0-9.()]/.test(k)) press(k);
  else if (k === "+") op("+");
  else if (k === "-") op("-");
  else if (k === "*") op("*");
  else if (k === "/") op("/");
  else if (k === "^") op("^");
  else if (k === "Enter") calculate();
  else if (k === "Backspace") backspace();
  else if (k === "Escape") clearAll();
});
