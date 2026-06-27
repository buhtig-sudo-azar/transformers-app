"use client";

import { useState } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";

type FamilyKey = "bert" | "gpt" | "t5";

const FAMILIES: Record<FamilyKey, {
  name: string;
  year: string;
  arch: string;
  params: string;
  objective: string;
  attention: string;
  norm: string;
  ffn: string;
  pe: string;
  mask: string;
  examples: string;
  bestFor: string;
  badFor: string;
}> = {
  bert: {
    name: "BERT",
    year: "2018",
    arch: "Encoder-only",
    params: "110M / 340M (Base/Large)",
    objective: "Masked Language Model (15% токенов маскируются, модель предсказывает)",
    attention: "Bidirectional self-attention",
    norm: "LayerNorm (Post-LN)",
    ffn: "GELU, ratio 4×",
    pe: "Learned absolute",
    mask: "Padding only",
    examples: "BERT, RoBERTa, DeBERTa, ELECTRA, ALBERT",
    bestFor: "Классификация, NER, embedding-модели (sentence-transformers), retrieval",
    badFor: "Генерация текста (нет causal mask)",
  },
  gpt: {
    name: "GPT-семейство",
    year: "2018+",
    arch: "Decoder-only",
    params: "От 117M (GPT-2 small) до 1.8T+ (GPT-4)",
    objective: "Next-token prediction (максимум правдоподобия следующего токена)",
    attention: "Causal self-attention",
    norm: "LayerNorm → RMSNorm (Llama onwards)",
    ffn: "GELU → SwiGLU (Llama onwards)",
    pe: "Learned absolute → RoPE (Llama onwards)",
    mask: "Causal + padding",
    examples: "GPT-2/3/4, Llama 1/2/3, Mistral, Qwen, Gemma, Claude",
    bestFor: "Генерация, чат, reasoning, код, любые задачи через prompting",
    badFor: "Bidirectional понимание (BERT лучше для классификации в small-scale)",
  },
  t5: {
    name: "T5",
    year: "2019",
    arch: "Encoder-Decoder",
    params: "60M — 11B (T5-11B)",
    objective: "Span corruption (маскируем куски текста, модель генерирует их)",
    attention: "Encoder: bidirectional; Decoder: causal + cross-attention",
    norm: "LayerNorm (RMSNorm в T5 v1.1)",
    ffn: "GELU → Gated GELU (T5 v1.1)",
    pe: "Learned relative position bias",
    mask: "Encoder: padding. Decoder: causal + padding + cross-attn",
    examples: "T5, mT5, Flan-T5, BART, Whisper (для ASR)",
    bestFor: "Перевод, summarization, question answering, seq2seq задачи",
    badFor: "Универсальные чат-боты (хуже scale'ится, чем decoder-only)",
  },
};

type FeatureRow = {
  feature: string;
  key: keyof typeof FAMILIES.bert;
};

const COMPARISON_ROWS: FeatureRow[] = [
  { feature: "Архитектура", key: "arch" },
  { feature: "Год", key: "year" },
  { feature: "Параметры", key: "params" },
  { feature: "Objective", key: "objective" },
  { feature: "Attention", key: "attention" },
  { feature: "Маска", key: "mask" },
  { feature: "Нормализация", key: "norm" },
  { feature: "FFN", key: "ffn" },
  { feature: "Positional encoding", key: "pe" },
  { feature: "Примеры", key: "examples" },
];

export function Module09Families() {
  const accent = ACCENTS[9];
  const [highlight, setHighlight] = useState<FamilyKey | null>(null);

  return (
    <ModuleShell
      id={9}
      title="BERT vs GPT vs T5 — что именно варьируется"
      subtitle="Все три семейства — трансформеры, но различаются: какая часть архитектуры используется, какой objective, какая маска, какая positional encoding. Сводная таблица + разбор, почему decoder-only победил в LLM."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        увидеть все архитектурные различия BERT / GPT / T5 в одной таблице — и понять, почему именно decoder-only стал стандартом для больших LLM.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Трансформер как архитектурный примитив появился в 2017. Через год
          появилось <strong>BERT</strong> (Google, октябрь 2018) — encoder-only,
          обученный на masked language modeling. Через месяц —{" "}
          <strong>GPT</strong> (OpenAI, июнь 2018) — decoder-only, next-token
          prediction. Ещё через год — <strong>T5</strong> (Google, 2019) —
          encoder-decoder, span corruption.
        </p>
        <p>
          Эти три работы задали три «колеи», по которым шло развитие. К 2024
          году расстановка такая:
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Decoder-only (GPT-семейство):</strong> победил в LLM.
            GPT-4, Claude, Llama, Mistral, Qwen, Gemma — все decoder-only.
            Причина: простота scale'инга, один objective, легко
            распараллеливать.
          </li>
          <li>
            <strong>Encoder-only (BERT-семейство):</strong> нишево для{" "}
            <em>понимания</em> текста. Современные embedding-модели
            (Sentence-BERT, E5, GTE, BGE) — это BERT-производные. Также
            используется в классификации, NER, retrieval.
          </li>
          <li>
            <strong>Encoder-Decoder (T5-семейство):</strong> нишево для
            seq2seq задач — перевод, summarization, ASR (Whisper). Не
            масштабируется до general-purpose LLM так же гладко, как
            decoder-only.
          </li>
        </ul>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Сравнительная таблица — наведи для подсветки">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left border-b border-border text-muted-foreground text-[10px] uppercase tracking-wide">
                  Характеристика
                </th>
                {(Object.keys(FAMILIES) as FamilyKey[]).map((k) => (
                  <th
                    key={k}
                    onMouseEnter={() => setHighlight(k)}
                    onMouseLeave={() => setHighlight(null)}
                    className={cn(
                      "p-2 text-left border-b border-border cursor-default transition-colors",
                      highlight === k
                        ? "bg-cyan-100 dark:bg-cyan-900/40"
                        : "bg-card"
                    )}
                  >
                    <div className="font-bold text-sm">{FAMILIES[k].name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{FAMILIES[k].year}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="p-2 border-b border-border/60 text-muted-foreground font-semibold">
                    {row.feature}
                  </td>
                  {(Object.keys(FAMILIES) as FamilyKey[]).map((k) => (
                    <td
                      key={k}
                      onMouseEnter={() => setHighlight(k)}
                      onMouseLeave={() => setHighlight(null)}
                      className={cn(
                        "p-2 border-b border-border/60 transition-colors align-top",
                        highlight === k && "bg-cyan-50 dark:bg-cyan-950/30"
                      )}
                    >
                      <div className="text-foreground/90">{FAMILIES[k][row.key]}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SandboxBlock>

      <SandboxBlock accent={accent} title="Сильные и слабые стороны каждого">
        <div className="grid sm:grid-cols-3 gap-3">
          {(Object.keys(FAMILIES) as FamilyKey[]).map((k) => {
            const f = FAMILIES[k];
            return (
              <Card
                key={k}
                className={cn(
                  "p-4 border-2 transition-all",
                  highlight === k
                    ? "border-cyan-400 dark:border-cyan-700"
                    : "border-cyan-200 dark:border-cyan-800/60"
                )}
                onMouseEnter={() => setHighlight(k)}
                onMouseLeave={() => setHighlight(null)}
              >
                <div className="font-bold text-sm mb-3">{f.name}</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold mb-0.5">
                      <Check className="h-3 w-3" />
                      Лучше всего для:
                    </div>
                    <div className="text-foreground/80 pl-4">{f.bestFor}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-semibold mb-0.5">
                      <X className="h-3 w-3" />
                      Плохо для:
                    </div>
                    <div className="text-foreground/80 pl-4">{f.badFor}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="MLM (Masked Language Model)"
          definition="Objective BERT: маскируем 15% токенов, модель предсказывает их. Видит контекст с обеих сторон — bidirectional."
          accent={accent}
        />
        <DefCard
          term="Span corruption (T5)"
          definition="Обобщение MLM: маскируем не отдельные токены, а куски (spans) длиной 1-5. Модель генерирует их последовательно. Учит и понимание, и генерацию."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Почему decoder-only победил в LLM?</strong> Главные причины:
        </p>
        <ol className="space-y-2 list-decimal pl-5">
          <li>
            <strong>Простота одного objective.</strong> Next-token prediction —
            одно правило для любого текста. Не нужно придумывать, что
            маскировать (BERT) или какие spans (T5).
          </li>
          <li>
            <strong>Гибкость downstream.</strong> Decoder-only через prompting
            решает любую задачу — классификацию, генерацию, перевод, код.
            BERT нужно дообучать под каждую задачу. T5 тоже гибче BERT, но
            требует prefix-tuning или task-prefix.
          </li>
          <li>
            <strong>Emergent abilities.</strong> Начиная с ~10B параметров,
            decoder-only модели начинают «следовать инструкциям» без
            fine-tuning. У BERT такого нет — он не генерирует текст.
          </li>
          <li>
            <strong>Scaling laws.</strong> Эмпирически оказалось, что
            decoder-only модели scale'ятся предсказуемо (Kaplan 2020,
            Chinchilla 2022). Это дало уверенность вкладывать сотни миллионов
            в обучение GPT-3, GPT-4.
          </li>
        </ol>
        <p>
          <strong>Но encoder-only не умер:</strong> современные embedding-модели
          для RAG (E5, GTE, BGE) — это BERT-производные. Bidirectional
          attention даёт более качественные семантические эмбеддинги, чем
          causal. Так что выбор архитектуры зависит от задачи: для
          генерации — decoder-only, для понимания и retrieval — encoder-only,
          для seq2seq — encoder-decoder.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
