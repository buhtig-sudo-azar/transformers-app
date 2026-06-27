# Трансформеры — архитектура целиком

Интерактивное приложение: разберитесь, как из attention-механизма
собирается полная архитектура трансформера — Q/K/V проекции, causal и
padding маски, feed-forward слои, residual connections, LayerNorm,
encoder/decoder семейства, positional encoding (sin/cos, RoPE, ALiBi),
сквозной forward pass и что варьируется между BERT, GPT и T5.

**10 модулей с живыми песочницами.**

> Это приложение — продолжение курса [«Эмбеддинги и attention»](https://embeddings-app.vercel.app/).
> В свою очередь, он ведёт к [«Как нейросети учатся»](https://nn-learning-app.vercel.app/).

## Возможности

- **10 интерактивных модулей** с живыми песочницами на React + TypeScript
- **Карта пайплайна** — кликай на этапы, видишь формы тензоров
- **Q/K/V playground** — выбор токена-Query, температура softmax, живые веса
- **Mask painter** — переключение causal / padding / обе маски
- **FFN playground** — ReLU / GELU / SiLU / SwiGLU, expansion ratio
- **Gradient flow simulator** — вкл/выкл residual и LayerNorm, глубина до 48 слоёв
- **Сравнение архитектур** — Encoder (BERT) / Decoder (GPT) / Encoder-Decoder (T5)
- **PE визуализация** — heatmap для sin/cos, RoPE, ALiBi
- **11-шаговый forward pass** по transformer block
- **Сравнительная таблица** BERT / GPT / T5 по всем характеристикам
- **Прогресс сохраняется** локально в `localStorage`
- **Светлая/тёмная тема** с переключателем
- **Адаптивный дизайн** — мобильные и десктопы
- **Доступность**: keyboard-friendly, `aria-label`, `prefers-reduced-motion`

## Модули

1. От attention к трансформеру — карта архитектуры
2. Q, K, V проекции — почему три матрицы
3. Causal и padding маски
4. Feed-forward слой — expand, activate, contract
5. Residual connections и LayerNorm
6. Encoder, Decoder, Encoder-Decoder — три семейства
7. Positional encoding — Sin/Cos, RoPE, ALiBi
8. Сквозной forward pass по слою
9. BERT vs GPT vs T5 — что варьируется
10. Что изучать дальше — roadmap

## Технологии

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **lucide-react** для иконок

## Локальный запуск

```bash
bun install
bun run dev     # http://localhost:3000
bun run lint    # проверка кода
```

## Структура проекта

```
src/
├── app/
│   ├── globals.css       # Tailwind + янтарный акцент (oklch 0.62 0.16 65)
│   ├── layout.tsx        # metadata, шрифты, theme toggle
│   └── page.tsx          # Hero, навигация, 10 модулей, footer
├── components/
│   ├── learn/
│   │   ├── accents.ts          # 10 акцентов + MODULE_META
│   │   ├── shell.tsx           # ModuleShell, TheoryBlock, SandboxBlock
│   │   ├── scroll-to-top.tsx   # кнопка «наверх» с янтарной пульсацией
│   │   ├── theme-toggle.tsx    # светлая/тёмная тема
│   │   └── module-NN-*.tsx     # 10 модулей
│   └── ui/                     # shadcn/ui компоненты
└── lib/
    ├── use-local-storage.ts    # SSR-safe localStorage хук
    ├── use-progress.tsx        # трекинг прогресса (transformers-progress-v1)
    └── utils.ts                # cn() и пр.
```

## Связанные курсы

- [ML с нуля](https://ml-s-nula.vercel.app/) — бирюзовый курс: линейная регрессия, градиентный спуск, простые нейросети
- [Токенизация](https://tokenizatsiya-app.vercel.app/) — фиолетовый курс: BPE, WordPiece, SentencePiece, byte-level
- [Эмбеддинги и attention](https://embeddings-app.vercel.app/) — изумрудный курс: эмбеддинги, cosine, word2vec, attention
- **Трансформеры** (этот курс, янтарный)
- [Как нейросети учатся](https://nn-learning-app.vercel.app/) — rose курс: backprop, оптимизаторы, регуляризация

## Создатель

**AZAR**
