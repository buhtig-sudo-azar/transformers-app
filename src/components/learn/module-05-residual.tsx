"use client";

import { useState } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Plus, Layers } from "lucide-react";

type NormType = "layer" | "rms" | "none";

const NORMS: Record<NormType, { label: string; formula: string; desc: string }> = {
  layer: {
    label: "LayerNorm",
    formula: "LN(x) = γ·(x − μ)/σ + β",
    desc: "Нормализует по последней оси (d). У каждого токена своё μ и σ. BERT, GPT-2, GPT-3.",
  },
  rms: {
    label: "RMSNorm",
    formula: "RMS(x) = x / √(mean(x²) + ε) · γ",
    desc: "Упрощённый LayerNorm: без вычитания среднего, только масштабирование по RMS. Llama, Qwen, Mistral. Быстрее на ~10-50%.",
  },
  none: {
    label: "Без нормализации",
    formula: "x → x",
    desc: "Без LayerNorm активации взрываются или затухают. Глубокие модели не обучаются.",
  },
};

export function Module05Residual() {
  const accent = ACCENTS[5];
  const [depth, setDepth] = useState([12]);
  const [withResidual, setWithResidual] = useState(true);
  const [withNorm, setWithNorm] = useState<NormType>("layer");
  const [noise, setNoise] = useState([10]);

  // Симулируем прохождение сигнала через N слоёв
  // Без residual: x_n = f(x_{n-1}), сигнал затухает/взрывается
  // С residual: x_n = x_{n-1} + f(x_{n-1}), сигнал сохраняется
  const trace = (() => {
    const N = depth[0];
    const eps = (noise[0] / 100); // 0..0.3
    const arr: number[] = [];
    let x = 1.0;
    arr.push(x);
    for (let i = 0; i < N; i++) {
      // Имитация под-слоя: умножение на ~0.95 + шум
      const f = 0.95 + (Math.random() - 0.5) * eps;
      let sublayer = x * f;
      // Нормализация
      if (withNorm === "layer" || withNorm === "rms") {
        sublayer = Math.sign(sublayer) * Math.min(Math.abs(sublayer), 1.5);
      }
      x = withResidual ? x + sublayer * 0.1 : sublayer;
      arr.push(x);
    }
    return arr;
  })();

  return (
    <ModuleShell
      id={5}
      title="Residual connections и LayerNorm — почему глубокие трансформеры вообще обучаются"
      subtitle="Residual (x + Sublayer(x)) пропускает градиент в обход слоёв. LayerNorm стабилизирует масштаб активаций. Без них 12+ слоёв не обучаются — взрыв или затухание градиента."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        увидеть, как residual connection и LayerNorm вместе позволяют обучать глубокие модели (96+ слоёв у GPT-3) — и почему без них градиент умирает.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Когда в 2015 году He et al. предложили <strong>ResNet</strong> с
          residual connections, они решили проблему, мучившую глубокие сети:
          чем больше слоёв, тем хуже обучение. Причина — при backprop
          градиент умножается на веса каждого слоя, и произведение десятков
          матриц либо уходит в ноль (vanishing), либо в бесконечность
          (exploding).
        </p>
        <p>
          Решение гениально простое: <strong>добавить вход к выходу</strong>.
          Формула: <code className="font-mono text-xs">y = x + F(x)</code>, где
          F — под-слой. Теперь градиент может течь через{" "}
          <code className="font-mono text-xs">x</code> напрямую, в обход F —
          производная <code className="font-mono text-xs">∂y/∂x = 1 + ∂F/∂x</code>,
          и даже если <code className="font-mono text-xs">∂F/∂x</code> мал,
          единица спасает градиент.
        </p>
        <p>
          В трансформере residual оборачивает <em>каждый</em> под-слой:
          после attention и после FFN. Формула блока:
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
{`# Pre-LN вариант (используется в большинстве современных LLM)
x = x + Attn(LN(x))
x = x + FFN(LN(x))
# x сохраняет ту же форму [batch, seq, d] через все слои`}
        </pre>
        <p>
          <strong>LayerNorm</strong> делает вторую работу: нормализует
          активации по последней оси (d). У каждого токена вычисляются своё
          среднее и дисперсия, и вектор масштабируется к нулевому среднему и
          единичной дисперсии. Затем применяются обучаемые параметры γ
          (scale) и β (shift). Без LN активации разных слоёв «уплывают» в
          разные масштабы — даже с residual.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Gradient flow simulator — включай/выключай residual и LN">
        <div className="space-y-4">
          {/* Переключатели */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="p-3 border-fuchsia-200 dark:border-fuchsia-800/60">
              <div className="text-[10px] uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-2">
                Residual connection
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={withResidual ? "default" : "outline"}
                  onClick={() => setWithResidual(true)}
                  className={cn(withResidual && "bg-fuchsia-600 hover:bg-fuchsia-700 text-white")}
                >
                  Вкл (x + F(x))
                </Button>
                <Button
                  size="sm"
                  variant={!withResidual ? "default" : "outline"}
                  onClick={() => setWithResidual(false)}
                  className={cn(!withResidual && "bg-destructive hover:bg-destructive/90 text-white")}
                >
                  Выкл (только F(x))
                </Button>
              </div>
            </Card>

            <Card className="p-3 border-fuchsia-200 dark:border-fuchsia-800/60">
              <div className="text-[10px] uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-2">
                Нормализация
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(NORMS) as NormType[]).map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={withNorm === n ? "default" : "outline"}
                    onClick={() => setWithNorm(n)}
                    className={cn(withNorm === n && "bg-fuchsia-600 hover:bg-fuchsia-700 text-white")}
                  >
                    {NORMS[n].label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Описание нормализации */}
          <Card className="p-3 border-fuchsia-200 dark:border-fuchsia-800/60 bg-fuchsia-50/30 dark:bg-fuchsia-950/20">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[10px]">
                {NORMS[withNorm].label}
              </Badge>
              <code className="font-mono text-[10px] text-muted-foreground">
                {NORMS[withNorm].formula}
              </code>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {NORMS[withNorm].desc}
            </p>
          </Card>

          {/* Глубина и шум */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300 font-semibold">
                  Глубина (число слоёв)
                </span>
                <span className="font-mono text-xs">{depth[0]}</span>
              </div>
              <Slider value={depth} onValueChange={setDepth} min={1} max={48} step={1} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                <span>1</span>
                <span>12 (GPT-2)</span>
                <span>48</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300 font-semibold">
                  Шум в под-слоях
                </span>
                <span className="font-mono text-xs">{(noise[0] / 100).toFixed(2)}</span>
              </div>
              <Slider value={noise} onValueChange={setNoise} min={0} max={30} step={1} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                <span>стабильно</span>
                <span>шумно</span>
              </div>
            </div>
          </div>

          {/* Визуализация */}
          <Card className="p-4 border-fuchsia-200 dark:border-fuchsia-800/60">
            <div className="text-[10px] uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300 font-semibold mb-3">
              Величина сигнала по слоям (нажми «Выкл residual», чтобы увидеть затухание)
            </div>
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {trace.map((v, i) => {
                const h = Math.min(Math.abs(v) * 20, 100);
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-0.5 shrink-0"
                    title={`Слой ${i}: ${v.toFixed(3)}`}
                  >
                    <div
                      className={cn(
                        "w-3 rounded-t transition-all",
                        Math.abs(v) > 5
                          ? "bg-red-500"
                          : Math.abs(v) < 0.1
                          ? "bg-muted-foreground/30"
                          : "bg-fuchsia-500 dark:bg-fuchsia-400"
                      )}
                      style={{ height: `${h}%` }}
                    />
                    {i % 4 === 0 && (
                      <span className="text-[8px] font-mono text-muted-foreground">{i}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-fuchsia-500 dark:bg-fuchsia-400 rounded-sm" />
                стабильный сигнал
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-sm" />
                взрыв (&gt;5)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-muted-foreground/30 rounded-sm" />
                затухание (&lt;0.1)
              </span>
            </div>
          </Card>

          {/* Предупреждения */}
          {!withResidual && depth[0] > 8 && (
            <Card className="p-3 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <div className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                <strong>⚠ Без residual при {depth[0]} слоях сигнал затухает или взрывается.</strong>{" "}
                Это и есть причина, почему до ResNet (2015) глубокие сети не обучались. Трансформер с 96+ слоями (GPT-3) физически невозможен без residual.
              </div>
            </Card>
          )}
          {withNorm === "none" && depth[0] > 4 && (
            <Card className="p-3 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
              <div className="text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                <strong>⚠ Без нормализации активации дрейфуют.</strong>{" "}
                Даже с residual масштаб x растёт линейно — следующие слои работают в неконтролируемом режиме. LN/RMSNorm держит масштаб в рамках.
              </div>
            </Card>
          )}
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Pre-LN vs Post-LN"
          definition="Оригинал 2017: Post-LN (нормализация после residual). Современные LLM: Pre-LN (до под-слоя) — стабильнее обучается, не нужен warmup. GPT-2 onwards = Pre-LN."
          accent={accent}
        />
        <DefCard
          term="RMSNorm vs LayerNorm"
          definition="RMSNorm убирает вычитание среднего — только деление на RMS. На ~10-50% быстрее, качество сравнимое. Llama, Qwen, Mistral — все на RMSNorm."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Инсайты для запоминания:</strong>
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Residual = градиентное шоссе.</strong> Без него глубокие
            модели не обучаются — это касается не только трансформеров, но и
            CNN (ResNet), и любых глубоких архитектур.
          </li>
          <li>
            <strong>LayerNorm = стабилизация масштаба.</strong> Не путать с
            BatchNorm (нормализация по батчу) — в NLP батчи неоднородны,
            нормировка per-position работает лучше.
          </li>
          <li>
            <strong>Pre-LN vs Post-LN:</strong> в оригинальной статье LN
            стоял <em>после</em> residual (Post-LN). GPT-2 перешёл на Pre-LN
            (нормализация <em>до</em> под-слоя) — это стабилизирует обучение
            глубоких моделей без сложного warmup.
          </li>
          <li>
            <strong>RMSNorm</strong> (Llama, Qwen) — упрощение LayerNorm без
            mean-вычитания. Эмпирически работает не хуже, экономит вычисления.
          </li>
        </ul>
      </TheoryBlock>
    </ModuleShell>
  );
}
