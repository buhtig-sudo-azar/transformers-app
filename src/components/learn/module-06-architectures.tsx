"use client";

import { useState } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, ArrowDown, Layers, Repeat } from "lucide-react";

type ArchType = "encoder" | "decoder" | "encdec";

const ARCHS: Record<ArchType, {
  label: string;
  models: string;
  attention: string;
  mask: string;
  desc: string;
  useCase: string;
  color: string;
}> = {
  encoder: {
    label: "Encoder-only",
    models: "BERT, RoBERTa, DeBERTa, ELECTRA",
    attention: "Bidirectional self-attention",
    mask: "Padding only (видит весь контекст)",
    desc: "Каждый токен видит все остальные — модель понимает контекст в обе стороны. Идеальна для понимания, не для генерации.",
    useCase: "Классификация, NER, embedding-модели, retrieval",
    color: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50",
  },
  decoder: {
    label: "Decoder-only",
    models: "GPT-2/3/4, Llama, Mistral, Qwen, Claude",
    attention: "Causal self-attention",
    mask: "Causal + padding (не видит будущее)",
    desc: "Токен видит только прошлое. Обучается next-token prediction. Превосходно генерирует текст, но «не видит» правый контекст.",
    useCase: "Генерация текста, чат-боты, кодогенерация, reasoning",
    color: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50",
  },
  encdec: {
    label: "Encoder-Decoder",
    models: "T5, BART, Whisper, оригинальный Transformer (2017)",
    attention: "Encoder: bidirectional; Decoder: causal + cross-attention",
    mask: "Encoder: padding. Decoder: causal + padding + cross-attn padding",
    desc: "Encoder читает вход, decoder генерирует выход. Cross-attention связывает их. Лучшее из обоих миров для seq2seq задач.",
    useCase: "Перевод, summarization, speech-to-text, вопрос-ответ",
    color: "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50",
  },
};

export function Module06Architectures() {
  const accent = ACCENTS[6];
  const [arch, setArch] = useState<ArchType>("decoder");
  const a = ARCHS[arch];

  return (
    <ModuleShell
      id={6}
      title="Encoder, Decoder, Encoder-Decoder — три семейства"
      subtitle="Один и тот же transformer block можно собирать по-разному. BERT — только encoder (видит весь контекст). GPT — только decoder (только прошлое). T5 — и то, и другое, со склеивающим cross-attention."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        понять, чем отличаются три архитектурных семейства трансформеров и почему для разных задач (классификация vs генерация vs перевод) выбирают разные.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          В оригинальной статье 2017 года трансформер был{" "}
          <strong>encoder-decoder</strong>: encoder читал исходное
          предложение (для перевода), decoder генерировал перевод. Encoder
          использовал bidirectional attention, decoder — causal + cross-attention
          на encoder-выход.
        </p>
        <p>
          Но soon выяснилось, что для разных задач оптимальны разные части:
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Encoder-only (BERT, 2018):</strong> если нужно{" "}
            <em>понять</em> текст (классификация, NER, retrieval), bidirectional
            attention даёт лучшее представление. Token видит контекст с обеих
            сторон.
          </li>
          <li>
            <strong>Decoder-only (GPT-2, 2019):</strong> если нужно{" "}
            <em>генерировать</em> текст, causal mask делает модель
            авторегрессионной — мы можем семплировать токен за токеном. Все
            современные LLM (GPT-4, Claude, Llama) — decoder-only.
          </li>
          <li>
            <strong>Encoder-Decoder (T5, 2019):</strong> для seq2seq задач
            (перевод, summarization, ASR) — encoder понимает вход, decoder
            генерирует выход, cross-attention связывает их.
          </li>
        </ul>
        <p>
          Почему decoder-only победил в LLM? Причина — <strong>scaling
          simplicity</strong>: одна архитектура, один objective (next-token
          prediction), проще распараллеливать, проще scale. T5 тоже scale'ится,
          но cross-attention добавляет сложность. К 2024 году почти все
          большие LLM — decoder-only.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Сравнение трёх архитектур">
        <div className="space-y-4">
          {/* Переключатель */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ARCHS) as ArchType[]).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={arch === k ? "default" : "outline"}
                onClick={() => setArch(k)}
                className={cn(arch === k && "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600")}
              >
                {ARCHS[k].label}
              </Button>
            ))}
          </div>

          {/* Описание */}
          <Card className="p-4 border-red-200 dark:border-red-800/60 bg-red-50/30 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("font-mono text-[10px]", a.color)}>{a.label}</Badge>
              <span className="text-xs text-muted-foreground">{a.models}</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
              {a.desc}
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-card p-2 border border-border">
                <div className="text-[10px] uppercase tracking-wide text-red-700 dark:text-red-300 font-semibold mb-0.5">
                  Attention
                </div>
                <div>{a.attention}</div>
              </div>
              <div className="rounded-md bg-card p-2 border border-border">
                <div className="text-[10px] uppercase tracking-wide text-red-700 dark:text-red-300 font-semibold mb-0.5">
                  Маска
                </div>
                <div>{a.mask}</div>
              </div>
              <div className="rounded-md bg-card p-2 border border-border sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wide text-red-700 dark:text-red-300 font-semibold mb-0.5">
                  Задачи
                </div>
                <div>{a.useCase}</div>
              </div>
            </div>
          </Card>

          {/* Схема потока */}
          <Card className="p-4 border-red-200 dark:border-red-800/60">
            <div className="text-[10px] uppercase tracking-wide text-red-700 dark:text-red-300 font-semibold mb-3">
              Поток данных
            </div>
            {arch === "encoder" && (
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="rounded bg-muted px-2 py-1.5">вход</span>
                <ArrowRight className="h-3 w-3" />
                <span className="rounded bg-red-100 dark:bg-red-900/40 px-2 py-1.5 border border-red-300 dark:border-red-700">
                  Encoder × N
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="rounded bg-muted px-2 py-1.5">[CLS] → classifier</span>
              </div>
            )}
            {arch === "decoder" && (
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="rounded bg-muted px-2 py-1.5">prev tokens</span>
                <ArrowRight className="h-3 w-3" />
                <span className="rounded bg-orange-100 dark:bg-orange-900/40 px-2 py-1.5 border border-orange-300 dark:border-orange-700">
                  Decoder × N (causal)
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="rounded bg-muted px-2 py-1.5">next token</span>
              </div>
            )}
            {arch === "encdec" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  <span className="rounded bg-muted px-2 py-1.5">source</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-red-100 dark:bg-red-900/40 px-2 py-1.5 border border-red-300 dark:border-red-700">
                    Encoder × N
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-muted px-2 py-1.5">encoder-out</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  <span className="rounded bg-muted px-2 py-1.5">prev target</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-orange-100 dark:bg-orange-900/40 px-2 py-1.5 border border-orange-300 dark:border-orange-700">
                    Decoder × N (causal + cross-attn)
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="rounded bg-muted px-2 py-1.5">next target</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  ↑ Cross-attention: decoder-queries смотрят на encoder-keys
                </div>
              </div>
            )}
          </Card>
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="Cross-attention"
          definition="В encoder-decoder: decoder-queries × encoder-keys → веса × encoder-values. Это «мост» между входом и выходом. Есть только в T5/BART/Whisper."
          accent={accent}
        />
        <DefCard
          term="Prefix LM"
          definition="Гибрид: первые k токенов видны bidirectionally (как encoder), остальные — causal. Используется в GLM, некоторых вариантах PaLM."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Тренд 2020-2024:</strong> decoder-only победил. Причина —
          простота масштабирования. Один objective (next-token), одна
          архитектура, проще распараллеливать на кластерах. T5 и BART
          остаются нишевыми для задач, где вход и выход сильно разной длины
          или структуры (перевод, ASR).
        </p>
        <p>
          <strong>Encoder-only живёт в retrieval:</strong> BERT-производные
          ( Sentence-BERT, E5, GTE) — основа современных embedding-моделей
          для RAG. Bidirectional attention даёт более качественные
          эмбеддинги, чем decoder-only. Так что три семейства не «вытеснили»
          друг друга — они заняли разные ниши.
        </p>
        <p>
          <strong>Для чего вам знать это:</strong> при выборе модели на
          HuggingFace вы будете видеть <code className="font-mono text-xs">BertForSequenceClassification</code>,{" "}
          <code className="font-mono text-xs">LlamaForCausalLM</code>,{" "}
          <code className="font-mono text-xs">T5ForConditionalGeneration</code> —
          эти имена подсказывают, какое семейство вы используете и для каких
          задач модель подходит.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
