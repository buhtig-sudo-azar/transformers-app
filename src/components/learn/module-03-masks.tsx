"use client";

import { useState, useMemo } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";

type MaskType = "none" | "causal" | "padding" | "both";

const TOKENS = ["Маша", "ела", "кашу", "[PAD]", "[PAD]"];

const MASK_DESCRIPTIONS: Record<MaskType, { title: string; desc: string }> = {
  none: {
    title: "Без маски (full bidirectional)",
    desc: "Каждый токен смотрит на все остальные. Так работает encoder у BERT — модель видит весь контекст одновременно.",
  },
  causal: {
    title: "Causal mask",
    desc: "Токен i видит только токены 0..i (включая себя). Используется в decoder-only моделях (GPT, Llama). Запрещает «заглядывать в будущее».",
  },
  padding: {
    title: "Padding mask",
    desc: "[PAD] токены маскируются — на них никто не смотрит и они сами ни на кого не смотрят. Нужны потому что батчи одинаковой длины, а реальные предложения разной.",
  },
  both: {
    title: "Causal + padding",
    desc: "В decoder-моделях GPT применяются обе маски одновременно: нельзя смотреть в будущее + [PAD] токены игнорируются.",
  },
};

export function Module03Masks() {
  const accent = ACCENTS[3];
  const [mask, setMask] = useState<MaskType>("causal");

  // Матрица [seq × seq], где [i][j] = можно ли токену i смотреть на j
  const matrix = useMemo(() => {
    const n = TOKENS.length;
    const m: boolean[][] = Array.from({ length: n }, () => Array(n).fill(true));

    // Causal: i >= j (можно смотреть назад)
    if (mask === "causal" || mask === "both") {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (j > i) m[i][j] = false;
        }
      }
    }

    // Padding: [PAD] токены (индексы 3, 4) — на них не смотрят и они не смотрят
    if (mask === "padding" || mask === "both") {
      for (let i = 0; i < n; i++) {
        if (TOKENS[i] === "[PAD]") {
          for (let j = 0; j < n; j++) {
            m[i][j] = false; // PAD никого не видит
            m[j][i] = false; // никто не видит PAD
          }
        }
      }
    }

    return m;
  }, [mask]);

  return (
    <ModuleShell
      id={3}
      title="Causal и padding маски — как запретить «смотреть в будущее»"
      subtitle="Маска — это -∞ в тех позициях матрицы QKᵀ, которые нужно занулить. Без causal маски GPT видел бы будущие токены и не научился бы предсказывать. Без padding маски модель тратила бы внимание на мусорные [PAD] токены."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        понять, как работает маскирование в attention — кликни на разные типы маски и увидишь, как меняется матрица «кто на кого смотрит».
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Attention-механизм сам по себе <strong>симметричен</strong>: каждый
          токен смотрит на все остальные. Но для языковой модели это плохо —
          если при предсказании токена <code className="font-mono text-xs">t</code> мы
          видим <code className="font-mono text-xs">t+1, t+2, ...</code>, модель
          не научится предсказывать, она просто «скопирует» будущее.
        </p>
        <p>
          Решение — <strong>causal mask</strong>: в матрице{" "}
          <code className="font-mono text-xs">QKᵀ</code> мы зануляем (точнее,
          ставим <code className="font-mono text-xs">-∞</code>) все ячейки выше
          диагонали. После softmax они станут нулями — токен <code className="font-mono text-xs">i</code> получит
          нулевой вес от токенов <code className="font-mono text-xs">j &gt; i</code>.
        </p>
        <p>
          <strong>Padding mask</strong> — отдельная история. Батч состоит из
          последовательностей разной длины; короткие добиваются{" "}
          <code className="font-mono text-xs">[PAD]</code> токенами. Эти токены
          не несут смысла, и внимание на них нужно занулить. Поэтому в маску
          добавляется ещё один слой: все позиции, где стоит [PAD],
          маскируются (по строкам и столбцам).
        </p>
        <p>
          В decoder-моделях (GPT, Llama) применяются <strong>обе маски
          одновременно</strong>. В encoder-моделях (BERT) — только padding
          (потому что BERT видит весь контекст bidirectionally, это и есть
          его фишка).
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Mask painter — переключай типы маски">
        <div className="space-y-4">
          {/* Переключатель */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(MASK_DESCRIPTIONS) as MaskType[]).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={mask === m ? "default" : "outline"}
                onClick={() => setMask(m)}
                className={cn(
                  mask === m && "bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-700 dark:hover:bg-rose-600"
                )}
              >
                {MASK_DESCRIPTIONS[m].title}
              </Button>
            ))}
          </div>

          {/* Описание выбранной маски */}
          <Card className="p-3 border-rose-200 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="text-xs leading-relaxed text-foreground/90">
              {MASK_DESCRIPTIONS[mask].desc}
            </div>
          </Card>

          {/* Матрица внимания */}
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-muted-foreground text-[10px] font-mono">
                    Q ╲ K
                  </th>
                  {TOKENS.map((t, j) => (
                    <th
                      key={j}
                      className={cn(
                        "p-1 font-mono text-[10px]",
                        TOKENS[j] === "[PAD]"
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground/70"
                      )}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOKENS.map((t, i) => (
                  <tr key={i}>
                    <th
                      className={cn(
                        "p-1 font-mono text-[10px] text-right",
                        TOKENS[i] === "[PAD]"
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground/70"
                      )}
                    >
                      {t}
                    </th>
                    {matrix[i].map((allowed, j) => {
                      const isPad = TOKENS[i] === "[PAD]" || TOKENS[j] === "[PAD]";
                      return (
                        <td
                          key={j}
                          className={cn(
                            "p-0.5 text-center border border-border/40",
                            allowed
                              ? "bg-rose-200 dark:bg-rose-800/60"
                              : "bg-muted/50 dark:bg-muted/20",
                            isPad && "opacity-60"
                          )}
                        >
                          {allowed ? (
                            <Eye className="inline h-3 w-3 text-rose-700 dark:text-rose-300" />
                          ) : (
                            <EyeOff className="inline h-3 w-3 text-muted-foreground" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-rose-700 dark:text-rose-300" />
              внимание разрешено
            </span>
            <span className="flex items-center gap-1">
              <EyeOff className="h-3 w-3 text-muted-foreground" />
              маскировано (становится 0 после softmax)
            </span>
            <span className="flex items-center gap-1">
              <span className="line-through text-muted-foreground/50 font-mono">[PAD]</span>
              — игнорируется
            </span>
          </div>
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Почему -∞, а не 0?"
          definition="До softmax. 0 после exp() всё ещё даёт 1, и маскированный токен получил бы вес. -∞ после exp() даёт 0 — вот тогда действительно зануляется."
          accent={accent}
        />
        <DefCard
          term="Triangular mask"
          definition="Causal маска — это нижнетреугольная матрица: 1 под и на диагонали, 0 выше. В NumPy: torch.tril(torch.ones(n, n))."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Что важно помнить:</strong> маска применяется к{" "}
          <em>скороам</em> до softmax, а не к весам после. Если занулить веса
          после softmax, они не будут суммироваться в 1 — распределение
          сломается. Правильный путь:{" "}
          <code className="font-mono text-xs">scores = QKᵀ/√d + mask</code>{" "}
          (где mask = 0 где разрешено и -∞ где запрещено), затем softmax — и
          только потом веса суммируются в 1.
        </p>
        <p>
          В коде это выглядит так:
        </p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
{`scores = Q @ K.transpose(-1, -2) / sqrt(d_k)
scores = scores.masked_fill(mask == 0, float('-inf'))
attn = softmax(scores, dim=-1)
out = attn @ V`}
        </pre>
        <p>
          В encoder-decoder моделях (T5) есть ещё <strong>cross-attention
          mask</strong>: decoder смотрит на encoder-выход, и там тоже нужен
          padding mask по длине source-последовательности. Это третья маска
          в семье, но концептуально — та же padding-логика.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
