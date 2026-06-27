"use client";

import { useState, useMemo } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowRight, Sigma } from "lucide-react";

// 6 токенов, 4-d пространство (учебно)
const TOKENS = ["кошка", "собака", "бежит", "быстро", "по", "полю"];

// «Эмбеддинги» — игрушечные 4-d вектора
const EMBED: Record<string, number[]> = {
  кошка: [0.9, 0.1, 0.2, 0.0],
  собака: [0.85, 0.15, 0.25, 0.05],
  бежит: [0.1, 0.9, 0.3, 0.1],
  быстро: [0.2, 0.8, 0.4, 0.2],
  по: [0.0, 0.1, 0.05, 0.9],
  полю: [0.05, 0.2, 0.1, 0.85],
};

// Параметры Wq, Wk, Wv — простые матрицы 4x4 (детерминированные)
// Подобраны так, чтобы Q·Kᵀ давал осмысленные скоры
const WQ = [
  [1.0, 0.0, 0.1, 0.0],
  [0.0, 1.0, 0.1, 0.0],
  [0.1, 0.1, 1.0, 0.0],
  [0.0, 0.0, 0.0, 1.0],
];
const WK = [
  [1.0, 0.0, 0.1, 0.0],
  [0.0, 1.0, 0.1, 0.0],
  [0.1, 0.1, 1.0, 0.0],
  [0.0, 0.0, 0.0, 1.0],
];
const WV = [
  [0.5, 0.1, 0.0, 0.0],
  [0.1, 0.5, 0.0, 0.0],
  [0.0, 0.0, 0.5, 0.1],
  [0.0, 0.0, 0.1, 0.5],
];

function matvec(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function Module02QKV() {
  const accent = ACCENTS[2];
  const [selected, setSelected] = useState(0);
  const [temp, setTemp] = useState([10]);

  // Предварительно вычисляем Q, K, V для всех токенов
  const { Q, K, V } = useMemo(() => {
    const Q = TOKENS.map((t) => matvec(WQ, EMBED[t]));
    const K = TOKENS.map((t) => matvec(WK, EMBED[t]));
    const V = TOKENS.map((t) => matvec(WV, EMBED[t]));
    return { Q, K, V };
  }, []);

  // Скоры Q[sel] · K[j]ᵀ / sqrt(d) для всех j
  const scores = useMemo(() => {
    const d = 4;
    const sqrtD = Math.sqrt(d);
    return K.map((kj) => dot(Q[selected], kj) / sqrtD);
  }, [Q, K, selected]);

  // Softmax с температурой
  const attention = useMemo(() => {
    const t = temp[0] / 10;
    const scaled = scores.map((s) => s * t);
    return softmax(scaled);
  }, [scores, temp]);

  // Output: взвешенная сумма V
  const output = useMemo(() => {
    const out = [0, 0, 0, 0];
    V.forEach((vj, j) => {
      for (let i = 0; i < 4; i++) out[i] += attention[j] * vj[i];
    });
    return out;
  }, [V, attention]);

  return (
    <ModuleShell
      id={2}
      title="Q, K, V проекции — почему именно три матрицы"
      subtitle="В attention мы умножаем вход на три разные матрицы, получая Query, Key, Value. Зачем три? Что было бы с одной? Разбираемся на живом примере 6 токенов в 4-мерном пространстве."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        понять, зачем нужны три отдельные проекции (Q, K, V) и почему их нельзя объединить в одну — посмотреть, как Query одного токена «опрашивает» Keys остальных и собирает взвешенную сумму Values.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          В embeddings-app мы видели формулу{" "}
          <code className="font-mono text-xs">softmax(QKᵀ/√d)·V</code>. Но
          откуда берутся Q, K, V? Это{" "}
          <strong>три разные линейные проекции входа</strong>: каждая — своя
          матрица весов <code className="font-mono text-xs">W_Q, W_K, W_V</code>,
          которые модель обучает.
        </p>
        <p>
          Метафора: <strong>поиск в библиотеке</strong>. <ConceptChip>Query</ConceptChip> —
          что вы ищете («книги про кошек»). <ConceptChip>Key</ConceptChip> —
          что написано на корешках книг («кошки», «собаки», «бег»).{" "}
          <ConceptChip>Value</ConceptChip> — содержимое книги. Сначала Query
          сравнивается со всеми Keys (получаем скоры «насколько релевантна
          каждая книга»), затем softmax даёт веса, и мы суммируем Values
          пропорционально этим весам.
        </p>
        <p>
          <strong>Почему три матрицы, а не одна?</strong> Если бы Q = K = V =
          x, мы бы считали <code className="font-mono text-xs">softmax(xxᵀ)x</code> —
          каждый токен «смотрел бы» только на похожие на себя, и информация
          не перетекала бы между семантически разными группами. Три проекции
          дают модели свободу: один и тот же токен может быть «хорошим
          Query» (задавать вопрос), «хорошим Key» (отвечать на чужие вопросы)
          и «хорошим Value» (давать содержательный ответ) — это{" "}
          <strong>три разные роли</strong>.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Q·Kᵀ → softmax → Σ V — кликай токен-Query">
        <div className="space-y-4">
          {/* Выбор Query */}
          <div>
            <div className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold mb-2">
              Выбери токен-Query (по кому считаем attention)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TOKENS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
                    selected === i
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-card border-border hover:border-orange-300 dark:hover:border-orange-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Температура */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold">
                Температура softmax
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ×{(temp[0] / 10).toFixed(1)}
              </span>
            </div>
            <Slider
              value={temp}
              onValueChange={setTemp}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
              <span>«мягкий» (×0.1)</span>
              <span>острый (×3.0)</span>
            </div>
          </div>

          {/* Q, K, V векторы выбранного токена */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="p-3 border-orange-200 dark:border-orange-800/60">
              <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold mb-1">
                Query · {TOKENS[selected]}
              </div>
              <div className="font-mono text-xs space-y-0.5">
                {Q[selected].map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">q[{i}]</span>
                    <span>{v.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-3 border-orange-200 dark:border-orange-800/60">
              <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold mb-1">
                Key · {TOKENS[selected]}
              </div>
              <div className="font-mono text-xs space-y-0.5">
                {K[selected].map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">k[{i}]</span>
                    <span>{v.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-3 border-orange-200 dark:border-orange-800/60">
              <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold mb-1">
                Value · {TOKENS[selected]}
              </div>
              <div className="font-mono text-xs space-y-0.5">
                {V[selected].map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">v[{i}]</span>
                    <span>{v.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Attention weights */}
          <Card className="p-4 border-orange-200 dark:border-orange-800/60">
            <div className="flex items-center gap-2 mb-3">
              <Sigma className="h-4 w-4 text-orange-700 dark:text-orange-300" />
              <span className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold">
                Веса attention: на кого смотрит «{TOKENS[selected]}»
              </span>
            </div>
            <div className="space-y-1.5">
              {TOKENS.map((t, j) => {
                const w = attention[j];
                return (
                  <div key={t} className="flex items-center gap-2">
                    <span className="font-mono text-xs w-16 text-right">{t}</span>
                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded transition-all",
                          j === selected
                            ? "bg-orange-700 dark:bg-orange-500"
                            : "bg-orange-400 dark:bg-orange-600"
                        )}
                        style={{ width: `${Math.max(w * 100, 1)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs w-12 text-right">
                      {(w * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Output */}
          <Card className="p-4 bg-orange-50/50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800">
            <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-300 font-semibold mb-2">
              Выход attention: взвешенная сумма Values
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="font-mono text-xs">
                out[{TOKENS[selected]}] =
              </code>
              {attention.map((w, j) => (
                <span key={j} className="font-mono text-xs">
                  {j > 0 && <span className="text-muted-foreground"> + </span>}
                  <span className="text-orange-700 dark:text-orange-300">
                    {w.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">·V[{TOKENS[j]}]</span>
                </span>
              ))}
              <ArrowRight className="h-3 w-3" />
              <span className="font-mono text-xs font-bold">
                [{output.map((v) => v.toFixed(2)).join(", ")}]
              </span>
            </div>
          </Card>
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Почему √d в знаменателе?"
          definition="Делим Q·K на √d, чтобы дисперсия скоров не росла с размерностью. Иначе softmax уходит в one-hot и градиенты затухают."
          accent={accent}
        />
        <DefCard
          term="d_k vs d_model"
          definition="В multi-head attention d_k = d_model / h. Каждый head работает в подпространстве d_k, потом результаты конкатенируются и смешиваются через W_O."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Интуиция, которую стоит запомнить:</strong> Query — это{" "}
          <em>вопрос</em>, Key — это <em>заголовок</em>, по которому происходит
          поиск, Value — это <em>содержимое</em>. Три разные матрицы дают
          модели свободу учить разные роли для одного и того же токена. В
          multi-head attention (модуль 7 в embeddings-app) этот трюк
          повторяется h раз параллельно — каждый head учит свою «задачу»
          (синтаксис, кореференцию, позицию и т.д.).
        </p>
        <p>
          Размеры: <code className="font-mono text-xs">W_Q, W_K ∈ R^(d×d_k)</code>,{" "}
          <code className="font-mono text-xs">W_V ∈ R^(d×d_v)</code>. Обычно{" "}
          <code className="font-mono text-xs">d_k = d_v = d_model / h</code>.
          В оригинальной статье d_model=512, h=8 → d_k=d_v=64. У GPT-3
          d_model=12288, h=96 → d_k=128.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
