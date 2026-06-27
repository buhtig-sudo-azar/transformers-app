"use client";

import { ModuleShell, TheoryBlock, SandboxBlock, GoalBlock, ConceptChip } from "@/components/learn/shell";
import { ACCENTS } from "@/components/learn/accents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ExternalLink, Code, BookOpen, Boxes, Wrench, Network, Layers, Cpu, Zap, GraduationCap, Brain } from "lucide-react";

const EMBEDDINGS_APP_URL = "https://embeddings-app.vercel.app/";
const TOKENIZATSIYA_URL = "https://tokenizatsiya-app.vercel.app/";
const NN_LEARNING_APP_URL = "https://nn-learning-app.vercel.app/";

const RESOURCES: Array<{
  icon: typeof BookOpen;
  title: string;
  description: string;
  url: string;
  linkLabel: string;
  tag: string;
}> = [
  {
    icon: BookOpen,
    title: "The Annotated Transformer",
    description:
      "Оригинальная статья «Attention Is All You Need» (Vaswani et al., 2017) с пошаговым кодом на PyTorch и комментариями. Лучший способ понять трансформер «изнутри» — пройти построчно.",
    url: "http://nlp.seas.harvard.edu/annotated-transformer/",
    linkLabel: "nlp.seas.harvard.edu",
    tag: "Статья + код",
  },
  {
    icon: BookOpen,
    title: "The Illustrated Transformer — Jay Alammar",
    description:
      "Классическая визуальная статья с картинками, которая объясняет архитектуру трансформера по шагам: embeddings, attention, multi-head, residual. Обязательна к прочтению.",
    url: "https://jalammar.github.io/illustrated-transformer/",
    linkLabel: "jalammar.github.io",
    tag: "Визуальный гайд",
  },
  {
    icon: Code,
    title: "Andrej Karpathy — Let's build GPT from scratch",
    description:
      "Двухчасовое видео, где Карпата на Python с нуля реализует GPT-подобную модель на игрушечном датасете Shakespeare. Лучший способ «почувствовать» архитектуру руками.",
    url: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
    linkLabel: "youtube.com — Karpathy",
    tag: "Видео",
  },
  {
    icon: BookOpen,
    title: "The Illustrated GPT-2 — Jay Alammar",
    description:
      "Visual guide по GPT-2: чем decoder-only отличается от оригинального encoder-decoder, как работает masked self-attention, как идёт генерация токен за токеном.",
    url: "https://jalammar.github.io/illustrated-gpt2/",
    linkLabel: "jalammar.github.io",
    tag: "Визуальный гайд",
  },
  {
    icon: Wrench,
    title: "HuggingFace Transformers — документация и курс",
    description:
      "Самая популярная библиотека для работы с трансформерами. Внутри есть исходники Llama, BERT, T5 — отличный способ прочитать production-код архитектур, которые мы разобрали.",
    url: "https://huggingface.co/docs/transformers/index",
    linkLabel: "huggingface.co/docs",
    tag: "Библиотека",
  },
  {
    icon: BookOpen,
    title: "RoFormer: Enhanced Transformer with RoPE",
    description:
      "Оригинальная статья о RoPE (Su et al., 2021). Объясняет математику поворота Q/K и почему relative position encoding работает лучше absolute.",
    url: "https://arxiv.org/abs/2104.09864",
    linkLabel: "arxiv.org/abs/2104.09864",
    tag: "Статья",
  },
  {
    icon: BookOpen,
    title: "FlashAttention: Fast and Memory-Efficient",
    description:
      "Dao et al. (2022) — IO-aware реализация attention. Статья объясняет, почему материализация полной [S,S] матрицы в HBM — главная бутылочка, и как это обойти.",
    url: "https://arxiv.org/abs/2205.14135",
    linkLabel: "arxiv.org/abs/2205.14135",
    tag: "Статья",
  },
  {
    icon: BookOpen,
    title: "Layer Normalization — Ba et al., 2016",
    description:
      "Оригинальная статья о LayerNorm. Если хотите понять математику нормализации и почему именно per-position, а не per-batch (как BatchNorm).",
    url: "https://arxiv.org/abs/1607.06450",
    linkLabel: "arxiv.org/abs/1607.06450",
    tag: "Статья",
  },
];

const NEXT_TOPICS: Array<{
  icon: typeof Code;
  title: string;
  short: string;
  description: string;
}> = [
  {
    icon: GraduationCap,
    title: "Как нейросети учатся",
    short: "Learning",
    description:
      "От backprop и chain rule до Adam, LR schedules, dropout, gradient clipping и mixed precision. Это фундамент, которого не хватает в этом курсе — мы разобрали архитектуру, но не то, как её обучают. Прямой следующий курс.",
  },
  {
    icon: Cpu,
    title: "Большие языковые модели",
    short: "LLM",
    description:
      "Pretraining objective, scaling laws (Chinchilla), emergent abilities, KV-cache для inference, sampling (temperature, top-k, top-p), hallucinations, in-context learning. Логичное продолжение после «как сети учатся».",
  },
  {
    icon: Zap,
    title: "Efficient inference",
    short: "Infer",
    description:
      "Квантизация (4-bit, 8-bit), KV-cache, speculative decoding, FlashAttention, attention sinks. Без этого LLM на 70B+ параметров было бы невозможно запускать локально.",
  },
  {
    icon: Layers,
    title: "Multimodal LLM",
    short: "MM",
    description:
      "Модели, которые работают не только с текстом, но и с картинками (GPT-4V, Claude 3), аудио, видео. Эмбеддинги разных модальностей приводятся к общему пространству через cross-attention или projection.",
  },
  {
    icon: Network,
    title: "Agents и tool use",
    short: "Agent",
    description:
      "LLM как «мозг» агента, который вызывает инструменты (поиск, код, API), планирует многошаговые задачи. Это следующий уровень после chat — AutoGPT, ReAct, function calling.",
  },
  {
    icon: BookOpen,
    title: "Mechanistic interpretability",
    short: "Interp",
    description:
      "Reverse-engineering обученных моделей: что именно выучила каждая голова, каждый нейрон? Anthropic Circuits, Transformer Circuits Thread, sparse autoencoders. Самое «научное» направление в LLM.",
  },
];

export function Module10Next() {
  const accent = ACCENTS[10];

  return (
    <ModuleShell
      id={10}
      title="Что изучать дальше — roadmap после этого курса"
      subtitle="Мы прошли путь от attention до полной архитектуры трансформера. Что осталось за кадром? Вот шесть больших направлений, в которые логично идти следующими."
      accent={accent}
    >
      <GoalBlock accent={accent}>
        составить план дальнейшего изучения — после того, как понятны Q/K/V, маски, FFN, residual, encoder/decoder и BERT/GPT/T5.
      </GoalBlock>

      <TheoryBlock accent={accent}>
        <p>
          Этот курс закрыл архитектурный фундамент: от Q/K/V до полной
          картины BERT/GPT/T5. Этого достаточно, чтобы{" "}
          <strong>читать код любой LLM</strong> на HuggingFace и понимать,
          что именно происходит в каждом слое. Но архитектура — это только
          половина истории. Вторая половина — <strong>как эту архитектуру
          обучают</strong> и <strong>что из неё получается при масштабировании</strong>.
        </p>
        <p>
          Важный момент: <strong>этот курс — про статику</strong>, про то,
          как устроен блок. Дальше лучше всего идти в{" "}
          <strong>динамику</strong> — backprop, оптимизаторы, регуляризация,
          LR schedules. Это следующий курс серии, и без него сложно понять,
          почему обучение GPT-3 стоит миллионы и занимает месяцы.
        </p>
      </TheoryBlock>

      {/* Блок-ссылка на следующий курс */}
      <div className="rounded-lg border-2 border-lime-300 bg-lime-50/50 dark:border-lime-700 dark:bg-lime-950/30 p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-500 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-lime-700 dark:text-lime-300 font-semibold mb-1">
              Продолжение серии · следующий курс
            </div>
            <h3 className="text-lg font-bold mb-2">
              «Как нейросети учатся» — backprop, Adam, регуляризация
            </h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              10 модулей о том, чего не было в этом курсе: loss functions,
              backprop и chain rule, оптимизаторы (SGD → Momentum → Adam →
              AdamW), LR schedules (warmup, cosine decay), dropout и
              регуляризация, batch/layer/RMSNorm, vanishing/exploding
              gradients, gradient clipping, mixed precision. С живыми
              песочницами: 2D loss surface с разными оптимизаторами, LR
              finder, dropout rate slider.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["Loss functions", "Backprop", "Adam/AdamW", "LR schedules", "Dropout", "Mixed precision"].map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] font-mono">
                  {t}
                </Badge>
              ))}
            </div>
            <a href={NN_LEARNING_APP_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-700 dark:hover:bg-lime-600"
              >
                <ArrowUpRight className="h-4 w-4 mr-1.5" />
                Перейти к курсу «Как нейросети учатся»
              </Button>
            </a>
          </div>
        </div>
      </div>

      <SandboxBlock accent={accent} title="Шесть направлений — куда расти дальше">
        <div className="grid sm:grid-cols-2 gap-3">
          {NEXT_TOPICS.map((t) => (
            <Card key={t.short} className="p-4 border-lime-200 dark:border-lime-800/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-200">
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{t.title}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t.short}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SandboxBlock>

      <SandboxBlock accent={accent} title="Кураторские ресурсы для углубления">
        <div className="grid sm:grid-cols-2 gap-3">
          {RESOURCES.map((r) => (
            <a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="p-4 border-lime-200 dark:border-lime-800/60 hover:border-lime-400 hover:shadow-md transition-all h-full">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-200">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-2">{r.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {r.tag}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-lime-700 dark:text-lime-300 mt-2 font-mono">
                      <ExternalLink className="h-3 w-3" />
                      {r.linkLabel}
                    </div>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </SandboxBlock>

      <div className="rounded-lg border-2 border-dashed border-lime-200 bg-lime-50/50 dark:border-lime-800/60 dark:bg-lime-950/30 p-5 text-center">
        <div className="text-xs uppercase tracking-wide text-lime-700 dark:text-lime-300 font-semibold mb-2">
          Возврат к материнским курсам
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
          Это приложение — продолжение двух курсов. Если хочешь вернуться к
          ним — кнопки ниже ведут на их главные страницы.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a href={EMBEDDINGS_APP_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Эмбеддинги и attention
            </Button>
          </a>
          <a href={TOKENIZATSIYA_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40"
            >
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Токенизация
            </Button>
          </a>
        </div>
      </div>
    </ModuleShell>
  );
}
