"use client";

import { useState } from "react";
import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip, DefCard } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowDown } from "lucide-react";

type Step = {
  id: number;
  name: string;
  desc: string;
  shape: string;
  formula: string;
  note?: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    name: "Input",
    desc: "На вход блока приходит тензор x [batch, seq, d]. В первом блоке это embeddings + positional encoding. В последующих — выход предыдущего блока.",
    shape: "[B, S, d]",
    formula: "x ← выход предыдущего блока",
  },
  {
    id: 2,
    name: "Pre-LayerNorm #1",
    desc: "Перед attention нормализуем x. Pre-LN стабильнее Post-LN — не нужен careful warmup.",
    shape: "[B, S, d]",
    formula: "x_norm = LayerNorm(x)",
  },
  {
    id: 3,
    name: "Q, K, V projections",
    desc: "Три линейных слоя: x → Q, x → K, x → V. Каждый со своими весами W_Q, W_K, W_V. Все три имеют форму [B, S, d] (если single-head; для multi-head: [B, h, S, d/h]).",
    shape: "Q, K, V: [B, S, d]",
    formula: "Q = x_norm·W_Q; K = x_norm·W_K; V = x_norm·W_V",
    note: "На modern LLM: W_Q, W_K, W_V обычно объединены в один qkv-параметр (memory layout оптимизация).",
  },
  {
    id: 4,
    name: "Attention scores",
    desc: "Скалярное произведение Q·Kᵀ / √d_k. Получаем матрицу [S, S] скоросов — насколько каждый токен «совпадает» с каждым.",
    shape: "scores: [B, h, S, S]",
    formula: "scores = (Q·Kᵀ) / √d_k",
  },
  {
    id: 5,
    name: "Apply mask",
    desc: "Добавляем -∞ там, где attention запрещён (causal: выше диагонали; padding: на [PAD] позициях).",
    shape: "[B, h, S, S]",
    formula: "scores = scores + mask  (mask: 0 или -∞)",
  },
  {
    id: 6,
    name: "Softmax",
    desc: "По последней оси (по keys). Теперь строки суммируются в 1 — это attention weights.",
    shape: "attn: [B, h, S, S]",
    formula: "attn = softmax(scores)",
  },
  {
    id: 7,
    name: "Output projection",
    desc: "Взвешенная сумма V по attention weights, затем линейная проекция W_O чтобы смешать головы.",
    shape: "[B, S, d]",
    formula: "attn_out = (attn·V)·W_O",
  },
  {
    id: 8,
    name: "Residual + (нет LN, если Pre-LN)",
    desc: "Добавляем вход к выходу attention. Если Pre-LN — то нормализация была в начале, второй LN не нужен перед residual.",
    shape: "[B, S, d]",
    formula: "x = x + attn_out",
  },
  {
    id: 9,
    name: "Pre-LayerNorm #2",
    desc: "Нормализуем перед FFN — тот же трюк, что и перед attention.",
    shape: "[B, S, d]",
    formula: "x_norm = LayerNorm(x)",
  },
  {
    id: 10,
    name: "Feed-forward",
    desc: "x_norm → W₁ (d→4d) → GELU/SwiGLU → W₂ (4d→d). Это «индивидуальное мышление» каждого токена.",
    shape: "[B, S, d]",
    formula: "ffn_out = W₂(σ(x_norm·W₁))",
    note: "Для SwiGLU: ffn_out = (SiLU(x·W₁) ⊙ x·W₃)·W₂",
  },
  {
    id: 11,
    name: "Residual + выход блока",
    desc: "Снова residual. Выход блока имеет ту же форму [B, S, d] — готов идти в следующий блок.",
    shape: "[B, S, d]",
    formula: "x = x + ffn_out",
  },
];

export function Module08ForwardPass() {
  const accent = ACCENTS[8];
  const [active, setActive] = useState(1);

  return (
    <ModuleShell
      id={8}
      title="Сквозной forward pass по слою — шаг за шагом"
      subtitle="Соберём всё, что разобрали в модулях 2-7, в один проход. 11 шагов от входа до выхода одного transformer block. Это «карта», по которой вы будете читать код любой LLM."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        пройти по шагам один transformer block — от входа [B, S, d] до выхода [B, S, d] — и на каждом шаге знать, что происходит, какая форма тензора и зачем это нужно.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Один <strong>transformer block</strong> принимает на вход{" "}
          <code className="font-mono text-xs">x ∈ [B, S, d]</code> и возвращает{" "}
          <code className="font-mono text-xs">x' ∈ [B, S, d]</code> — той же
          формы. Внутри — две «половины»: attention-половина и FFN-половина,
          каждая с Pre-LayerNorm и residual connection.
        </p>
        <p>
          Важно: размерность <code className="font-mono text-xs">d</code> не
          меняется нигде внутри блока. Это позволяет блокам{" "}
          <strong>складываться как конструктор</strong>: выход одного — вход
          другого. Глубина модели (N блоков) и есть её основная «ёмкость».
        </p>
        <p>
          Multi-head attention «разворачивается» в额外ую ось:{" "}
          <code className="font-mono text-xs">[B, S, d] → [B, h, S, d/h]</code> —
          каждый head работает в подпространстве d/h. После attention —
          concat обратно в [B, S, d] и проекция W_O.
        </p>
      </TheoryBlock>

      <SandboxBlock accent={accent} title="11 шагов одного блока — кликай по шагам">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
          {/* Список шагов */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "w-full text-left rounded-md border p-2 transition-all flex items-center gap-2",
                  active === s.id
                    ? "bg-teal-50 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700"
                    : "bg-card border-border hover:border-teal-300 dark:hover:border-teal-800"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold",
                    active === s.id
                      ? "bg-teal-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s.id}
                </span>
                <span className="text-xs font-medium truncate">{s.name}</span>
                {s.id < STEPS.length && (
                  <ArrowDown className="h-3 w-3 text-muted-foreground ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Детали шага */}
          <Card className="p-5 border-teal-200 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20">
            {(() => {
              const s = STEPS[active - 1];
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500 text-white font-mono text-sm font-bold">
                      {s.id}
                    </span>
                    <h3 className="text-base font-semibold">{s.name}</h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    shape: {s.shape}
                  </Badge>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="rounded-md bg-teal-100 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-teal-700 dark:text-teal-300 font-semibold mb-1">
                      Формула
                    </div>
                    <code className="font-mono text-xs text-foreground/90 break-all">
                      {s.formula}
                    </code>
                  </div>
                  {s.note && (
                    <div className="rounded-md bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 p-3 text-xs">
                      <span className="font-semibold text-cyan-700 dark:text-cyan-300">💡 Замечание:</span>{" "}
                      <span className="text-foreground/80">{s.note}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        </div>
      </SandboxBlock>

      <SandboxBlock accent={accent} title="Сквозной код одного блока (PyTorch-стиль)">
        <pre className="bg-card border border-border rounded-md p-4 text-xs overflow-x-auto font-mono leading-relaxed">
{`class TransformerBlock(nn.Module):
    def __init__(self, d, h, d_ff, attn_drop=0.0):
        super().__init__()
        self.ln1 = nn.LayerNorm(d)
        self.attn = MultiHeadAttention(d, h)
        self.ln2 = nn.LayerNorm(d)
        self.ffn = FFN(d, d_ff)  # SwiGLU или GELU
        self.drop = nn.Dropout(attn_drop)

    def forward(self, x, mask=None):
        # Attention-половина: Pre-LN → Attn → Residual
        x = x + self.drop(self.attn(self.ln1(x), mask))
        # FFN-половина: Pre-LN → FFN → Residual
        x = x + self.drop(self.ffn(self.ln2(x)))
        return x  # [B, S, d] — та же форма`}
        </pre>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Весь блок — это две строки <code className="font-mono text-xs">x = x + ...</code>.
          Pre-LN обеспечивает стабильность, residual — градиентный поток,
          mask — causal/padding. Никакой магии, но эта простота и есть
          причина, почему трансформер так хорошо scale'ится.
        </p>
      </SandboxBlock>

      <div className="grid sm:grid-cols-2 gap-3">
        <DefCard
          term="KV-cache"
          definition="При инференсе decoder-only: Q для нового токена × K,V для всех прошлых токенов. Чтобы не пересчитывать K,V каждый раз — кэшируем. Это даёт 10-100× ускорение на генерации."
          accent={accent}
        />
        <DefCard
          term="FlashAttention"
          definition="IO-aware реализация attention: не материализует полную [S,S] матрицу в HBM, считает блоками в SRAM. ~2-4× быстрее, минимум памяти. Стандарт в современных LLM."
          accent={accent}
        />
      </div>

      <TheoryBlock accent={accent}>
        <p>
          <strong>Как читать чужой код трансформера:</strong> откройте{" "}
          <code className="font-mono text-xs">LlamaDecoderLayer</code> на
          HuggingFace — вы увидите почти один-в-один ту же структуру:{" "}
          <code className="font-mono text-xs">input_layernorm → self_attn → residual → post_attention_layernorm → mlp → residual</code>.
          Это и есть Pre-LN transformer block. Отличия между Llama / Mistral /
          Qwen — в деталях: SwiGLU vs GELU, RMSNorm vs LayerNorm, RoPE vs
          ALiBi. Скелет — один и тот же.
        </p>
        <p>
          <strong>Для практики:</strong> попробуйте прочитать forward-метод
          любой модели на HF. Если вы узнаёте шаги 1-11 — значит вы поняли
          архитектуру. Если что-то непонятно — это повод вернуться к
          соответствующему модулю (маски → 3, residual → 5, RoPE → 7).
        </p>
      </TheoryBlock>
    </ModuleShell>
  );
}
