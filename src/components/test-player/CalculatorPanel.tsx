import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");

  const evaluate = () => {
    try {
      if (!/^[0-9+\-*/().^%\s,eE.piPIsqrtlogncosincoat]*$/.test(expr)) throw new Error("bad");
      const safe = expr
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\be\b/g, "Math.E")
        .replace(/\bsqrt\(/g, "Math.sqrt(")
        .replace(/\bsin\(/g, "Math.sin(")
        .replace(/\bcos\(/g, "Math.cos(")
        .replace(/\btan\(/g, "Math.tan(")
        .replace(/\blog\(/g, "Math.log10(")
        .replace(/\bln\(/g, "Math.log(")
        .replace(/\^/g, "**");
      const value = Function(`"use strict"; return (${safe})`)();
      setResult(String(value));
    } catch {
      setResult("Error");
    }
  };

  const button = (label: string, action: () => void, className = "") => (
    <button
      key={label}
      onClick={action}
      className={`h-11 rounded-lg border bg-white text-sm font-medium text-slate-900 active:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:active:bg-slate-700 ${className}`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div className="fixed inset-x-3 top-16 z-[75] mx-auto max-w-xs rounded-xl border bg-white p-3 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100 sm:inset-x-auto sm:right-3 sm:mx-0 sm:w-72">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Calculator</div>
        <button onClick={onClose} aria-label="Close calculator" className="p-1 text-slate-500 dark:text-slate-300">
          <X className="h-5 w-5" />
        </button>
      </div>
      <Input
        value={expr}
        onChange={(event) => setExpr(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") evaluate();
        }}
        placeholder="e.g. sqrt(2)+sin(pi/4)"
        className="mb-1 font-mono text-sm"
      />
      <div className="mb-2 min-h-[28px] rounded bg-slate-100 px-2 py-1 text-right font-mono text-sm dark:bg-slate-800">
        {result || "\u00a0"}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", ".", "0", "%", "+"].map(
          (key) => button(key, () => setExpr((current) => current + key)),
        )}
        {button("sqrt", () => setExpr((current) => current + "sqrt("))}
        {button("^", () => setExpr((current) => current + "^"))}
        {button("(", () => setExpr((current) => current + "("))}
        {button(")", () => setExpr((current) => current + ")"))}
        {button("sin", () => setExpr((current) => current + "sin("))}
        {button("cos", () => setExpr((current) => current + "cos("))}
        {button("log", () => setExpr((current) => current + "log("))}
        {button("pi", () => setExpr((current) => current + "pi"))}
        {button(
          "C",
          () => {
            setExpr("");
            setResult("");
          },
          "col-span-2 text-red-600 dark:text-red-400",
        )}
        {button("⌫", () => setExpr((current) => current.slice(0, -1)))}
        {button("=", evaluate, "bg-blue-600 text-white")}
      </div>
    </div>,
    document.body,
  );
}
