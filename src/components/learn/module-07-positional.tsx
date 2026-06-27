"use client";

import { useState, useMemo } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type PEType = "sincos" | "rope" | "alibi";

const PE_INFO: Record<PEType, { label: string; formula: string; desc: string; models: string }> = {
  sincos: {
    label: "Sin/Cos (оригинал)",
    formula: "PE(pos, 2i) = sin(pos / 10000^(2i/d))",
    desc: "Фиксированные (не обучаемые) синусы и косинусы разной частоты. Добавляются к эмбеддингам. Из оригинальной статьи 2017.",
    models: "Оригинальный Transformer, ранние модели",
  },
  rope: {
    label: "RoPE (Rotary)",
    formula: "q·k = (Rθ·q)·(Rθ·k) — поворот на угол θ(pos)",
    desc: "Position encoding применяется к Q и K как поворот в 2D-подпространствах. Относительная позиция encoded через угол поворота. Не добавляется к embeddings, а модифицирует Q/K.",
    models: "Llama 1/2/3, Mistral, Qwen, PaLM, Gemma",
  },
  alibi: {
    label: "ALiBi (Attention with Linear Biases)",
    formula: "score(i,j) -= m · |i − j|",
    desc: "Никаких positional embeddings! Вместо этого — штраф к attention-скору, пропорциональный расстоянию между токенами. Головы имеют разные наклоны m.",
    models: "BLOOM, mT5, некоторые варианты Llama",
  },
};

// Вычисляем sin/cos позиционные кодировки
function sincosPE(pos: number, d: number): number[] {
  const pe: number[] = [];
  for (let i = 0; i < d; i++) {
    const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / d);
    pe.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
  }
  return pe;
}

// Для RoPE: angle = pos / 10000^(2i/d), поворот пар (q_2i, q_2i+1) на angle
function ropeAngle(pos: number, i: number, d: number): number {
  return pos / Math.pow(10000, (2 * i) / d);
}

// ALiBi: attention weight for distance |i-j|, slope m
function alibiBias(distance: number, m: number): number {
  return -m * distance;
}

export function Module07Positional() {
  const accent = ACCENTS[7];
  const [pe, setPE] = useState<PEType>("rope");
  const [seqLen] = useState(16);
  const [d, setD] = useState([16]);

  // Матрица PE [seqLen × d]
  const peMatrix = useMemo(() => {
    const dd = d[0];
    if (pe === "sincos") {
      return Array.from({ length: seqLen }, (_, pos) => sincosPE(pos, dd));
    }
    if (pe === "rope") {
      // Для RoPE показываем углы поворота
      return Array.from({ length: seqLen }, (_, pos) =>
        Array.from({ length: dd }, (_, i) =>
          ropeAngle(pos, Math.floor(i / 2), dd)
        ).map((a) => (Math.sin(2 * a) + 1) / 2) // нормализуем в [0,1] для heatmap
      );
    }
    // ALiBi: матрица biased attention weights
    return Array.from({ length: seqLen }, (_, i) =>
      Array.from({ length: seqLen }, (_, j) => {
        const m = 1 / Math.pow(2, (i % 8) + 1); // разные наклоны
        return Math.exp(alibiBias(Math.abs(i - j), m));
      })
    );
  }, [pe, seqLen, d]);

  return (
    <ModuleShell
      id={7}
      title="Positional encoding — Sin/Cos, RoPE, ALiBi"
      subtitle="Трансформер не имеет рекуррентности — для него все токены «одинаковы по позиции». Чтобы модель знала, кто за кем идёт, позицию кодируют: либо добавляют к эмбеддингам (sin/cos), либо модифицируют Q/K (RoPE), либо штрафуют далёкие токены (ALiBi)."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        увидеть три принципиально разных способа encode'нуть позицию — и понять, почему Llama-семейство выбрало RoPE.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Self-attention <strong>пермутировочно-инвариантен</strong>: если
          переставить токены местами, результат будет таким же, только
          переставленным. Это значит, модель не различает «Маша любит Петю»
          и «Петя любит Машу». Чтобы восстановить порядок, нужно{" "}
          <strong>в явном виде</strong> добавить информацию о позиции.
        </p>
        <p>
          В оригинальной статье 2017 года использовались{" "}
          <strong>синусы и косинусы разной частоты</strong>:{" "}
          <code className="font-mono text-xs">PE(pos, 2i) = sin(pos/10000^(2i/d))</code>,{" "}
          <code className="font-mono text-xs">PE(pos, 2i+1) = cos(...)</code>.
          Идея в том, что для каждой позиции получается уникальный вектор, и
          близкие позиции имеют близкие векторы. Эти векторы{" "}
          <strong>добавлялись к эмбеддингам</strong>.
        </p>
        <p>
          Потом появились <strong>обучаемые позиционные эмбеддинги</strong>{" "}
          (BERT, GPT-2): вместо фиксированных sin/cos — таблица вида{" "}
          <code className="font-mono text-xs">[max_len, d]</code>, веса
          учатся вместе с моделью. Проблема: жёсткий потолок{" "}
          <code className="font-mono text-xs">max_len</code> — модель не может
          работать с последовательностями длиннее, чем видела при обучении.
        </p>
        <p>
          <strong>RoPE (Rotary Position Embedding)</strong> — современный
          стандарт (Llama, Mistral, Qwen). Идея: поворачивать Q и K в 2D-подпространствах
          на угол, пропорциональный позиции. Тогда{" "}
          <code className="font-mono text-xs">Q·K</code> зависит{" "}
          <em>только от относительной позиции</em> (разности позиций), а не от
          абсолютной. Это даёт extrapolation — модель может работать с
          длиннее-обученных контекстов. RoPE не добавляется к эмбеддингам, а
          модифицирует Q/K перед attention.
        </p>
        <p>
          <strong>ALiBi</strong> — ещё радикальнее: никаких positional
          embeddings вообще. Вместо этого к attention-скорам{" "}
          <em>до softmax</em> добавляется{" "}
          <code className="font-mono text-xs">-m·|i-j|</code> — штраф за
          расстояние. Головы имеют разные наклоны m (1/2, 1/4, 1/8, ...),
          что даёт разнообразие: одни головы смотрят локально, другие —
          глобально. BLOOM, mT5 — главные примеры.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="Визуализация positional encoding">
        <div className="space-y-4">
          {/* Переключатель */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PE_INFO) as PEType[]).map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={pe === k ? "default" : "outline"}
                onClick={() => setPE(k)}
                className={cn(pe === k && "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600")}
              >
                {PE_INFO[k].label}
              </Button>
            ))}
          </div>

          {/* Инфо */}
          <Card className="p-3 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="font-mono text-[10px]">
                {PE_INFO[pe].label}
              </Badge>
              <code className="font-mono text-[10px] text-muted-foreground">
                {PE_INFO[pe].formula}
              </code>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed mb-1">
              {PE_INFO[pe].desc}
            </p>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold">Где используется:</span> {PE_INFO[pe].models}
            </p>
          </Card>

          {/* Размерность */}
          {pe !== "alibi" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">
                  Размерность d (половина для визуализации)
                </span>
                <span className="font-mono text-xs">{d[0]}</span>
              </div>
              <Slider value={d} onValueChange={setD} min={8} max={32} step={2} className="w-full" />
            </div>
          )}

          {/* Heatmap */}
          <Card className="p-4 border-emerald-200 dark:border-emerald-800/60 overflow-x-auto">
            <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-3">
              {pe === "alibi"
                ? `Матрица attention весов [${seqLen} × ${seqLen}] (с ALiBi bias)`
                : `PE матрица [${seqLen} позиций × ${d[0]} измерений]`}
            </div>
            <div className="inline-block">
              <div
                className="grid gap-px"
                style={{
                  gridTemplateColumns: `repeat(${pe === "alibi" ? seqLen : d[0]}, minmax(0, 1fr))`,
                }}
              >
                {peMatrix.flatMap((row, i) =>
                  row.map((val, j) => {
                    // Нормализуем val в цвет
                    const v = pe === "sincos" ? (val + 1) / 2 : val;
                    const hue = pe === "sincos"
                      ? 160 // teal-emerald
                      : pe === "rope"
                      ? 160
                      : 160;
                    return (
                      <div
                        key={`${i}-${j}`}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: `hsl(${hue}, 70%, ${15 + v * 50}%)`,
                        }}
                        title={`pos=${i}, dim=${j}: ${val.toFixed(3)}`}
                      />
                    );
                  })
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
                <span>0.0</span>
                <div className="h-2 flex-1 rounded-sm" style={{
                  background: "linear-gradient(to right, hsl(160, 70%, 15%), hsl(160, 70%, 65%))",
                }} />
                <span>1.0</span>
              </div>
            </div>
          </Card>

          {/* Особенности */}
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <Card className="p-3 border-emerald-200 dark:border-emerald-800/60">
              <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                Тип
              </div>
              <div>
                {pe === "sincos" && "Абсолютный, фиксированный"}
                {pe === "rope" && "Относительный, поворот Q/K"}
                {pe === "alibi" && "Относительный, bias в attention"}
              </div>
            </Card>
            <Card className="p-3 border-emerald-200 dark:border-emerald-800/60">
              <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                Extrapolation на длинные контексты
              </div>
              <div>
                {pe === "sincos" && "⚠ Ограничено max_len"}
                {pe === "rope" && "✓ Хорошая (можно растянуть)"}
                {pe === "alibi" && "✓✓ Отличная"}
              </div>
            </Card>
            <Card className="p-3 border-emerald-200 dark:border-emerald-800/60">
              <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                Где живёт
              </div>
              <div>
                {pe === "sincos" && "В эмбеддингах (add)"}
                {pe === "rope" && "В Q и K (rotate)"}
                {pe === "alibi" && "В attention scores (-)"}
              </div>
            </Card>
          </div>
        </div>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="RoPE rotation"
          definition="Q и K разбиваются на пары (q_0,q_1), (q_2,q_3), ... Каждая пара поворачивается на угол θ_i = pos/10000^(2i/d). Это делает Q·K зависимым только от (pos_q - pos_k)."
          accent={accent}
        />
        <DefCard
          term="Context extension"
          definition="Llama 2 обучалась на 4k контексте, но через RoPE scaling (NTK, YaRN) работает на 32k-128k. RoPE позволяет «растянуть» углы без дообучения."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Практический итог 2024 года:</strong> RoPE — де-факто
          стандарт для decoder-only LLM. Он даёт relative position encoding
          (что лучше absolute), хорошую extrapolation (что критично для
          long-context), и относительно дёшев в вычислении. ALiBi
          используется реже, но остаётся элегантной альтернативой для задач,
          где нужен очень длинный контекст.
        </p>
        <p>
          <strong>Что важно знать инженеру:</strong> при работе с
          HuggingFace-моделями RoPE «спрятан» внутри{" "}
          <code className="font-mono text-xs">LlamaAttention</code> и его
          аналогов. Если вы меняете{" "}
          <code className="font-mono text-xs">max_position_embeddings</code> в
          конфиге, это не сработает для Llama (там RoPE), но сработает для
          BERT (там absolute). Для длинных контекстов у RoPE-моделей есть
          отдельные техники — YaRN, NTK-aware, LongRoPE — это уже продвинутая
          тема.
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
