"use client";

import { useState } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Boxes, Layers, Network, Sparkles, Zap } from "lucide-react";

type Stage = {
  id: number;
  label: string;
  short: string;
  shape: string;
  desc: string;
  formula?: string;
};

const STAGES: Stage[] = [
  {
    id: 1,
    label: "Токены",
    short: "tok",
    shape: "[batch, seq]",
    desc: "На входе — последовательность целых чисел-идентификаторов токенов. Это то, что выдаёт токенизатор (BPE, SentencePiece).",
  },
  {
    id: 2,
    label: "Embedding + Position",
    short: "emb",
    shape: "[batch, seq, d]",
    desc: "Каждый токен превращается в вектор длины d (например 768). К нему добавляется positional encoding — информация о позиции токена в последовательности.",
    formula: "x = Embed(tok) + PosEmb(pos)",
  },
  {
    id: 3,
    label: "Слой ×N",
    short: "blk",
    shape: "[batch, seq, d] × N",
    desc: "Один трансформер-блок повторяется N раз (4 → 96 → 120+). Каждый блок: self-attention → add&norm → FFN → add&norm. Форма тензора не меняется.",
    formula: "x = x + Attn(LN(x));  x = x + FFN(LN(x))",
  },
  {
    id: 4,
    label: "Финальный LayerNorm",
    short: "ln",
    shape: "[batch, seq, d]",
    desc: "После последнего блока — ещё один LayerNorm. Стабилизирует активации перед выходом.",
  },
  {
    id: 5,
    label: "Выход: logits или pooled",
    short: "out",
    shape: "[batch, seq, vocab] или [batch, d]",
    desc: "GPT: linear-проекция на размер словаря → logits для next-token prediction. BERT: для классификации берём [CLS] токен и пропускаем через классификатор.",
    formula: "logits = Linear(x)",
  },
];

const COMPONENTS = [
  {
    icon: Network,
    title: "Self-attention",
    desc: "Каждый токен «смотрит» на все остальные и собирает взвешенную сумму их значений. Это то, что мы разобрали в embeddings-app.",
    in: "x: [seq, d]",
    out: "x': [seq, d]",
  },
  {
    icon: Layers,
    title: "Feed-forward (FFN)",
    desc: "Два линейных слоя с нелинейностью между ними. Применяется к каждой позиции независимо. Расширяет d → 4d → d.",
    in: "x: [seq, d]",
    out: "x': [seq, d]",
  },
  {
    icon: Sparkles,
    title: "Residual + LayerNorm",
    desc: "После каждого под-слоя — Add & Norm: x = LayerNorm(x + Sublayer(x)). Residual пропускает градиент, LayerNorm стабилизирует.",
    in: "x: [seq, d]",
    out: "x': [seq, d]",
  },
  {
    icon: Boxes,
    title: "Positional encoding",
    desc: "Трансформер не имеет рекуррентности — позиция добавляется явно. Sin/cos (оригинал), learned (BERT/GPT), RoPE (Llama), ALiBi.",
    in: "—",
    out: "добавляется к embeddings",
  },
];

export function Module01Intro() {
  const accent = ACCENTS[1];
  const [active, setActive] = useState<Stage>(STAGES[0]);

  return (
    <ModuleShell
      id={1}
      title="От attention к трансформеру — карта архитектуры"
      subtitle="В embeddings-app мы разобрали attention как концепцию. Теперь соберём полную архитектуру: что именно находится между токенами на входе и логитами на выходе."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        увидеть трансформер как единый пайплайн — и понять, какие компоненты повторяются, какие встречаются один раз, и что именно мы будем разбирать в следующих 9 модулях.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          В 2017 году статья <strong>«Attention Is All You Need»</strong> (Vaswani
          et al.) предложила архитектуру, которая полностью отказалась от
          рекуррентности (RNN) и свёрток (CNN). Вместо этого — только{" "}
          <strong>self-attention</strong> + пара полносвязных слоёв + residuals.
          Эта простая конструкция оказалась настолько удачной, что через 6 лет
          на ней работает GPT-4, Claude, Llama, BERT, T5, Stable Diffusion
          (внутри U-Net) и десятки других моделей.
        </p>
        <p>
          Архитектура состоит из <strong>стека одинаковых блоков</strong>{" "}
          (transformer blocks). Внутри каждого блока — два под-слоя:{" "}
          <strong>multi-head self-attention</strong> и{" "}
          <strong>feed-forward network</strong>. После каждого под-слоя —{" "}
          <strong>residual connection</strong> и <strong>LayerNorm</strong>.
          Размерность тензора <code className="font-mono text-xs">[batch, seq, d]</code>{" "}
          не меняется на протяжении всего стека — поэтому блоки можно
          складывать сколько угодно (GPT-3 — 96 блоков, GPT-4 — ~120).
        </p>
        <p>
          На вход подаются токены (результат токенизации). Сначала они
          превращаются в эмбеддинги и к ним добавляется positional encoding.
          Затем — стек блоков. На выходе — либо logits для next-token
          prediction (GPT), либо pooled-вектор для классификации (BERT).
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Пайплайн: кликай на этапы">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
          {/* Пайплайн */}
          <div className="space-y-2">
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s)}
                className={cn(
                  "w-full text-left rounded-lg border-2 p-3 transition-all",
                  active.id === s.id
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700"
                    : "bg-card border-border hover:border-amber-300 dark:hover:border-amber-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold",
                      active.id === s.id
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{s.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {s.shape}
                      </Badge>
                    </div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Детали этапа */}
          <Card className="p-5 border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white font-mono font-bold">
                {active.id}
              </span>
              <h3 className="text-lg font-semibold">{active.label}</h3>
            </div>
            <Badge variant="outline" className="font-mono text-xs mb-3">
              shape: {active.shape}
            </Badge>
            <p className="text-sm text-foreground/90 leading-relaxed mb-4">
              {active.desc}
            </p>
            {active.formula && (
              <div className="rounded-md bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 p-3">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-1">
                  Формула
                </div>
                <code className="font-mono text-sm text-foreground/90">{active.formula}</code>
              </div>
            )}
            {active.id === 3 && (
              <div className="mt-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 p-3 text-xs">
                <span className="font-semibold text-orange-700 dark:text-orange-300">Важно:</span>{" "}
                <span className="text-foreground/80">
                  именно блок повторяется N раз. Все остальные компоненты — единожды.
                  Поэтому «глубина» трансформера = N блоков.
                </span>
              </div>
            )}
          </Card>
        </div>
      </SandboxBlock>

      <SandboxBlock accent={accent} title="Четыре компонента, которые мы разберём">
        <div className="grid sm:grid-cols-2 gap-3">
          {COMPONENTS.map((c) => (
            <Card key={c.title} className="p-4 border-amber-200 dark:border-amber-800/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {c.desc}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      in: {c.in}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      out: {c.out}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Transformer block"
          definition="Минимальный повторяющийся модуль: self-attention + add&norm + FFN + add&norm. Форма [batch, seq, d] сохраняется."
          accent={accent}
        />
        <DefCard
          term="Глубина vs ширина"
          definition="Глубина = N блоков (GPT-3: 96). Ширина = d (GPT-3: 12288). Scaling laws показывают, что и то, и другое важно."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Что мы разберём в следующих модулях:</strong> Q/K/V проекции
          (модуль 2), causal и padding маски (3), feed-forward слой (4),
          residual + LayerNorm (5), encoder vs decoder (6), positional
          encoding (7), сквозной forward pass по слою (8), что варьируется
          между BERT/GPT/T5 (9), и куда расти дальше (10).
        </p>
        <p>
          К концу курса у вас в голове должна сложиться полная картина: вы
          должны уметь прочитать архитектуру любой модели на HuggingFace
          (например, <code className="font-mono text-xs">LlamaForCausalLM</code>)
          и понять, что именно делает каждый вызов. Это база для всего
          дальнейшего — от LoRA-тюнинга до mechanistic interpretability.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
