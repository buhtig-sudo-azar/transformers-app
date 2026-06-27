"use client";

import { useState, useMemo } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowDown } from "lucide-react";

type Activation = "relu" | "gelu" | "silu" | "swiglu";

const ACTIVATIONS: Record<Activation, { label: string; formula: string; desc: string; fn: (x: number) => number; swiglu?: boolean }> = {
  relu: {
    label: "ReLU",
    formula: "max(0, x)",
    desc: "Простейшая. Оригинальный трансформер (2017). Недостаток: «мертвые нейроны» при x < 0.",
    fn: (x) => Math.max(0, x),
  },
  gelu: {
    label: "GELU",
    formula: "x · Φ(x) ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))",
    desc: "Гладкий аналог ReLU. BERT, GPT-2, GPT-3. Стало де-факто стандартом.",
    fn: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
  },
  silu: {
    label: "SiLU / Swish",
    formula: "x · sigmoid(x)",
    desc: "Гладкий, не обнуляет отрицательные полностью. Llama 1/2, Mistral.",
    fn: (x) => x * (1 / (1 + Math.exp(-x))),
  },
  swiglu: {
    label: "SwiGLU",
    formula: "SiLU(xW₁) ⊙ xW₃",
    desc: "GLU-вариант: две параллельные проекции, одна через SiLU. Llama 2/3, PaLM, Qwen. +1 матрица весов, но лучшее качество.",
    fn: (x) => x * (1 / (1 + Math.exp(-x))),
    swiglu: true,
  },
};

export function Module04FFN() {
  const accent = ACCENTS[4];
  const [ratio, setRatio] = useState([4]);
  const [act, setAct] = useState<Activation>("gelu");
  const [x, setX] = useState([10]); // -5..5, /10

  const xVal = (x[0] - 15) / 3; // -5..5
  const d = 4;
  const innerDim = d * ratio[0];

  // Симулируем 1 нейрон внутреннего слоя
  const innerActivation = useMemo(() => {
    const a = ACTIVATIONS[act];
    return a.fn(xVal);
  }, [act, xVal]);

  return (
    <ModuleShell
      id={4}
      title="Feed-forward слой — expand, activate, contract"
      subtitle="После attention каждый токен независимо проходит через двухслойный MLP: d → 4d → d. Это «индивидуальное мышление» каждого токена, в отличие от attention — «коллективного обмена»."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        понять, зачем нужен FFN, почему именно расширение 4×, какие бывают активации (ReLU, GELU, SiLU, SwiGLU) и почему Llama ушла на SwiGLU.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Трансформер-блок состоит из двух под-слоёв:{" "}
          <strong>self-attention</strong> и{" "}
          <strong>feed-forward network (FFN)</strong>. Если attention — это
          обмен информацией <em>между</em> токенами, то FFN — это{" "}
          <em>индивидуальная</em> обработка каждого токена: одна и та же
          MLP применяется к каждой позиции независимо.
        </p>
        <p>
          Стандартный FFN: <code className="font-mono text-xs">FFN(x) = GELU(x·W₁ + b₁)·W₂ + b₂</code>.
          Здесь <code className="font-mono text-xs">W₁ ∈ R^(d×4d)</code>,{" "}
          <code className="font-mono text-xs">W₂ ∈ R^(4d×d)</code>. То есть
          сначала расширяется в 4 раза, проходит нелинейность, потом сжимается
          обратно. Размер 4× — эмпирически подобранный в оригинальной статье;
          в некоторых моделях (T5) ratio=4, в Llama 2 — ratio примерно 2.66
          (но с SwiGLU).
        </p>
        <p>
          <strong>Почему именно расширение?</strong> Нелинейность в низком
          измерении не успевает «развернуть» представление. Расширение в 4d
          даёт сети пространство, чтобы применить нелинейность в более
          богатой форме, а потом спроецировать обратно в d-мерный stream.
          Это похоже на kernel trick в SVM: мы неявно работаем в
          пространстве более высокой размерности.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="FFN playground — крути ratio и активацию">
        <div className="space-y-4">
          {/* Выбор активации */}
          <div>
            <div className="text-xs uppercase tracking-wide text-pink-700 dark:text-pink-300 font-semibold mb-2">
              Функция активации
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTIVATIONS) as Activation[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAct(a)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                    act === a
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-card border-border hover:border-pink-300 dark:hover:border-pink-700"
                  )}
                >
                  {ACTIVATIONS[a].label}
                </button>
              ))}
            </div>
          </div>

          {/* Описание активации */}
          <Card className="p-3 border-pink-200 dark:border-pink-800/60 bg-pink-50/30 dark:bg-pink-950/20">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[10px]">
                {ACTIVATIONS[act].label}
              </Badge>
              <code className="font-mono text-[10px] text-muted-foreground">
                {ACTIVATIONS[act].formula}
              </code>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {ACTIVATIONS[act].desc}
            </p>
          </Card>

          {/* Ratio slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-pink-700 dark:text-pink-300 font-semibold">
                Expansion ratio (d → ratio·d)
              </span>
              <span className="font-mono text-xs">
                {d} → <span className="text-pink-700 dark:text-pink-300 font-bold">{innerDim}</span>
              </span>
            </div>
            <Slider
              value={ratio}
              onValueChange={setRatio}
              min={2}
              max={8}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
              <span>2× (Llama-style)</span>
              <span>4× (оригинал)</span>
              <span>8×</span>
            </div>
          </div>

          {/* Визуализация FFN */}
          <Card className="p-4 border-pink-200 dark:border-pink-800/60">
            <div className="text-[10px] uppercase tracking-wide text-pink-700 dark:text-pink-300 font-semibold mb-3">
              Прохождение одного значения через FFN
            </div>

            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-2 items-center">
              {/* Input */}
              <div className="text-center">
                <div className="font-mono text-xs text-muted-foreground">input</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {xVal.toFixed(2)}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              {/* Inner */}
              <div className="text-center">
                <div className="font-mono text-xs text-muted-foreground">× W₁ → σ</div>
                <div className="font-mono text-lg font-bold text-pink-700 dark:text-pink-300">
                  {innerActivation.toFixed(3)}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              {/* Output */}
              <div className="text-center">
                <div className="font-mono text-xs text-muted-foreground">× W₂</div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {(innerActivation * 0.5).toFixed(3)}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Input value (синтетический)
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {xVal.toFixed(2)}
                </span>
              </div>
              <Slider value={x} onValueChange={setX} min={0} max={30} step={1} className="w-full" />
            </div>
          </Card>

          {/* Архитектура FFN */}
          <Card className="p-4 border-pink-200 dark:border-pink-800/60 bg-pink-50/30 dark:bg-pink-950/20">
            <div className="text-[10px] uppercase tracking-wide text-pink-700 dark:text-pink-300 font-semibold mb-2">
              Архитектура FFN {act === "swiglu" && "(SwiGLU — две ветви)"}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="rounded bg-muted px-2 py-1">x ∈ R^{d}</span>
              <ArrowRight className="h-3 w-3" />
              {act === "swiglu" ? (
                <>
                  <span className="rounded bg-pink-100 dark:bg-pink-900/40 px-2 py-1 border border-pink-300 dark:border-pink-700">
                    W₁ → {innerDim}
                  </span>
                  <span className="rounded bg-pink-100 dark:bg-pink-900/40 px-2 py-1 border border-pink-300 dark:border-pink-700">
                    W₃ → {innerDim}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-muted px-2 py-1">SiLU(W₁x) ⊙ W₃x</span>
                </>
              ) : (
                <>
                  <span className="rounded bg-pink-100 dark:bg-pink-900/40 px-2 py-1 border border-pink-300 dark:border-pink-700">
                    W₁ → {innerDim}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-muted px-2 py-1">{ACTIVATIONS[act].label}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-pink-100 dark:bg-pink-900/40 px-2 py-1 border border-pink-300 dark:border-pink-700">
                    W₂ → {d}
                  </span>
                </>
              )}
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-muted px-2 py-1">out ∈ R^{d}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Параметры: {act === "swiglu" ? `3 матрицы = ${3 * d * innerDim}` : `2 матрицы = ${2 * d * innerDim}`}
              {" "}весов на FFN-слой
            </div>
          </Card>
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Почему FFN per-position?"
          definition="FFN применяется к каждому токену независимо — никакой информации между позициями не перетекает. Это симметрично: attention обменивается, FFN обрабатывает."
          accent={accent}
        />
        <DefCard
          term="Параметры FFN vs attention"
          definition="В типичном трансформере FFN составляет ~2/3 параметров блока. d → 4d → d = 8d², тогда как attention = 4d² (Q, K, V, O)."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>SwiGLU — современный стандарт.</strong> Llama 2, PaLM,
          Qwen, Mistral используют SwiGLU вместо классического GELU-FFN.
          Формула: <code className="font-mono text-xs">FFN(x) = SiLU(xW₁) ⊙ xW₃ · W₂</code> —
          две параллельные проекции <code className="font-mono text-xs">W₁</code> и{" "}
          <code className="font-mono text-xs">W₃</code> во внутреннее
          пространство, одна проходит через SiLU, потом они перемножаются
          (GLU-гейтинг). Это добавляет третью матрицу, но эмпирически даёт
          лучшее качество при том же compute — поэтому ratio уменьшают до
          ~2.66 (Llama 2: d=4096, inner=11008).
        </p>
        <p>
          <strong>Ключевой инсайт:</strong> FFN — это место, где модель
          «запоминает» факты. Механистическая интерпретируемость (modul 10 в
          embeddings-app) показала, что определённые нейроны в FFN-слоях
          активируются на конкретные концепты: «французский», «код на Python»,
          «учёный такой-то». Attention распределяет информацию, FFN её
          обрабатывает и сохраняет. Без FFN трансформер был бы просто
          сглаживающим фильтром.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
