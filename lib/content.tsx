import type { ReactNode } from "react";

// All the learning content lives here, so it can be edited without touching the UI code.

export type Level = "beginner" | "intermediate" | "advanced";
export type Focus = "ml" | "genai" | "nlp" | "ethics";
export type TagKind = "hot" | "new" | "info" | "warn";

export interface Tag {
  label: string;
  kind: TagKind;
}

export const LEVELS: { id: Level; label: string; color: string }[] = [
  { id: "beginner", label: "Beginner", color: "#3B8BD4" },
  { id: "intermediate", label: "Intermediate", color: "#EF9F27" },
  { id: "advanced", label: "Advanced", color: "#D85A30" },
];

export const FOCUS_AREAS: { id: Focus; label: string; color: string }[] = [
  { id: "ml", label: "ML / Deep Learning", color: "#1D9E75" },
  { id: "genai", label: "Generative AI", color: "#7F77DD" },
  { id: "nlp", label: "NLP", color: "#D4537E" },
  { id: "ethics", label: "AI Ethics", color: "#888780" },
];

export const TOOLS: { icon: string; iconBg: string; name: string; desc: string; tags: Tag[] }[] = [
  {
    icon: "✦",
    iconBg: "var(--blue-lt)",
    name: "Claude (Anthropic)",
    desc: "The Claude 5 family — Opus for the hardest reasoning and coding, Sonnet as the everyday all-rounder, Haiku for fast, low-cost tasks.",
    tags: [{ label: "Hot", kind: "hot" }, { label: "Reasoning", kind: "info" }],
  },
  {
    icon: "⬡",
    iconBg: "var(--green-lt)",
    name: "Gemini (Google)",
    desc: "Multimodal models with a free API tier — Gemini 3.8 Flash powers the AI Mentor in this app.",
    tags: [{ label: "Free tier", kind: "new" }, { label: "Multimodal", kind: "info" }],
  },
  {
    icon: "◈",
    iconBg: "var(--amber-lt)",
    name: "ChatGPT (OpenAI)",
    desc: "GPT-5-series models for chat, images and voice, with a strong API ecosystem for builders.",
    tags: [{ label: "All-rounder", kind: "info" }, { label: "Popular", kind: "warn" }],
  },
  {
    icon: "◇",
    iconBg: "var(--pink-lt)",
    name: "Open models on Hugging Face",
    desc: "Llama, Qwen, Mistral and thousands more — download and run them yourself, or try them free in Spaces.",
    tags: [{ label: "Open source", kind: "new" }, { label: "Run locally", kind: "info" }],
  },
];

export interface RoadmapStep {
  status: "done" | "curr" | "pend";
  title: string;
  detail: string;
  links: { label: string; href: string }[];
}

export const ROADMAP: Record<Level, RoadmapStep[]> = {
  beginner: [
    {
      status: "done",
      title: "Introduction to AI & ML",
      detail: "Understand what AI is, its history, key terms, and real-world uses.",
      links: [
        { label: "Coursera: AI for Everyone", href: "https://www.coursera.org/learn/ai-for-everyone" },
        { label: "YouTube: AI Explained", href: "https://www.youtube.com/watch?v=ad79nYk2keg" },
      ],
    },
    {
      status: "done",
      title: "Python basics",
      detail: "Variables, loops, functions, file handling. Python is the language of AI.",
      links: [
        { label: "LearnPython.org", href: "https://www.learnpython.org" },
        { label: "CS50P (Free)", href: "https://cs50.harvard.edu/python" },
      ],
    },
    {
      status: "done",
      title: "Python for ML — NumPy & Pandas",
      detail: "Data manipulation, arrays, and dataframes. Used in every ML project.",
      links: [
        { label: "Kaggle Pandas (Free)", href: "https://kaggle.com/learn/pandas" },
        { label: "NumPy Quickstart", href: "https://numpy.org/learn" },
      ],
    },
    {
      status: "curr",
      title: "Machine learning fundamentals",
      detail: "Linear regression, decision trees, model evaluation, scikit-learn basics.",
      links: [
        { label: "Andrew Ng ML Course", href: "https://www.coursera.org/specializations/machine-learning-introduction" },
      ],
    },
    {
      status: "pend",
      title: "Build your first ML project",
      detail: "Train a model on real data, evaluate it, and deploy a simple demo online.",
      links: [
        { label: "Kaggle Competitions", href: "https://kaggle.com/competitions" },
        { label: "HuggingFace Spaces", href: "https://huggingface.co/spaces" },
      ],
    },
    {
      status: "pend",
      title: "Intro to neural networks & deep learning",
      detail: "Perceptrons, backpropagation, TensorFlow and PyTorch basics.",
      links: [
        { label: "Fast.ai (Free)", href: "https://www.fast.ai" },
        { label: "TF Tutorials", href: "https://www.tensorflow.org/tutorials" },
      ],
    },
  ],
  intermediate: [
    {
      status: "curr",
      title: "Deep learning — CNN, RNN, Transformer",
      detail: "Understand and implement the core architectures powering modern AI.",
      links: [{ label: "Dive into Deep Learning", href: "https://d2l.ai" }],
    },
    {
      status: "pend",
      title: "NLP & large language models",
      detail: "Tokenization, fine-tuning BERT/GPT, prompt engineering, RLHF.",
      links: [{ label: "HuggingFace NLP Course", href: "https://huggingface.co/learn" }],
    },
    {
      status: "pend",
      title: "Computer vision & multimodal AI",
      detail: "Image classification, object detection, CLIP, and vision-language models.",
      links: [{ label: "Fast.ai Part 2", href: "https://www.fast.ai" }],
    },
  ],
  advanced: [
    {
      status: "curr",
      title: "Research paper reading & replication",
      detail: "Reproduce key papers: Attention is All You Need, CLIP, DALL-E, LoRA.",
      links: [{ label: "Hugging Face Trending Papers", href: "https://huggingface.co/papers/trending" }],
    },
    {
      status: "pend",
      title: "Custom model training at scale",
      detail: "Distributed training, FSDP, mixed precision, LoRA/PEFT fine-tuning.",
      links: [{ label: "PEFT Docs", href: "https://huggingface.co/docs/peft" }],
    },
    {
      status: "pend",
      title: "AI alignment & safety research",
      detail: "RLHF, Constitutional AI, interpretability, and responsible AI deployment.",
      links: [{ label: "Anthropic Research", href: "https://www.anthropic.com/research" }],
    },
  ],
};

export interface Topic {
  id: string;
  title: string;
  tag: Tag;
  focus: Focus[];
  keywords: string;
  body: ReactNode;
}

export const TOPICS: Topic[] = [
  {
    id: "ml",
    title: "What is machine learning?",
    tag: { label: "Core", kind: "info" },
    focus: ["ml"],
    keywords: "machine learning ml basics core supervised unsupervised",
    body: (
      <>
        Machine learning teaches computers to learn from examples instead of hand-coded rules. You
        don&apos;t write &quot;if ears are pointy and it meows → cat.&quot; You show the model thousands of
        labeled cat photos and it figures out the patterns on its own.
        <br />
        <br />
        <strong>Two main types:</strong> Supervised learning (labeled data, e.g. spam detection) and
        Unsupervised learning (unlabeled data, e.g. customer clustering).
        <br />
        <br />
        <strong>Key insight:</strong> More data + better algorithms = smarter models. Data replaces
        explicit rules.
      </>
    ),
  },
  {
    id: "llm",
    title: "How do large language models (LLMs) work?",
    tag: { label: "Hot", kind: "hot" },
    focus: ["genai", "nlp"],
    keywords: "llm large language model gpt claude gemini transformer chatgpt hot",
    body: (
      <>
        LLMs like ChatGPT, Claude, and Gemini are trained on massive text datasets. They learn to
        predict &quot;what token comes next?&quot; billions of times. Through this, they absorb language
        patterns, reasoning, and world knowledge.
        <br />
        <br />
        The architecture powering them is called a <strong>Transformer</strong>. It uses
        &quot;attention&quot; to understand which words in a sentence are most relevant to each other —
        even across long documents.
        <br />
        <br />
        <strong>Scale law:</strong> Bigger model + more data + more compute = significantly better
        performance. This is why each new generation of models has been such a large jump.
      </>
    ),
  },
  {
    id: "nn",
    title: "What is a neural network?",
    tag: { label: "Core", kind: "info" },
    focus: ["ml"],
    keywords: "neural network deep learning perceptron layers backpropagation",
    body: (
      <>
        A neural network is inspired by the human brain. It has layers of connected mathematical
        &quot;neurons.&quot; Data flows: input layer → hidden layers → output layer. Each connection has a
        weight that is adjusted during training.
        <br />
        <br />
        <strong>Deep learning</strong> = neural networks with many layers (the &quot;deep&quot; in deep
        learning). More layers allow the model to learn increasingly abstract patterns — from edges to
        shapes to faces.
        <br />
        <br />
        <strong>Training:</strong> The network makes predictions, calculates error (loss), and then
        adjusts weights using backpropagation to improve over time.
      </>
    ),
  },
  {
    id: "rag",
    title: "What is RAG (Retrieval Augmented Generation)?",
    tag: { label: "Trending", kind: "new" },
    focus: ["genai", "nlp"],
    keywords: "rag retrieval augmented generation vector database knowledge base chatbot new",
    body: (
      <>
        RAG = a search engine + an LLM working together. When you ask a question, RAG first retrieves
        relevant documents from a knowledge base (using vector similarity search), then passes those to
        the LLM as extra context. The LLM uses them to generate a grounded answer.
        <br />
        <br />
        <strong>Why it matters:</strong> LLMs cannot access your private data or recent events. RAG
        solves this without expensive fine-tuning.
        <br />
        <br />
        <strong>Used in:</strong> Company chatbots, document Q&amp;A systems, customer support, legal
        research tools.
      </>
    ),
  },
  {
    id: "prompt",
    title: "What is prompt engineering?",
    tag: { label: "Practical", kind: "hot" },
    focus: ["genai", "nlp"],
    keywords: "prompt engineering prompting chain of thought few shot system prompt api",
    body: (
      <>
        Prompt engineering is the skill of crafting inputs to an LLM to consistently get the best
        outputs. Small changes in phrasing can dramatically change results.
        <br />
        <br />
        <strong>Key techniques:</strong>
        <br />• <strong>Chain-of-thought:</strong> Ask the model to &quot;think step by step&quot; —
        dramatically improves reasoning
        <br />• <strong>Few-shot prompting:</strong> Show 2-3 examples of the format you want
        <br />• <strong>Role prompting:</strong> &quot;You are an expert Python developer...&quot;
        <br />• <strong>System prompts:</strong> Set the model&apos;s behavior, tone, and constraints
        upfront
      </>
    ),
  },
  {
    id: "finetune",
    title: "What is fine-tuning an AI model?",
    tag: { label: "Intermediate", kind: "info" },
    focus: ["ml", "genai"],
    keywords: "fine tuning training model lora peft domain specific custom",
    body: (
      <>
        Fine-tuning means taking a pre-trained model (like LLaMA or Mistral) and continuing to train it
        on your own domain-specific data. The model keeps its general knowledge but adapts to your
        specific task.
        <br />
        <br />
        <strong>Examples:</strong> Medical question answering, code in your company&apos;s style,
        customer support for your product, legal document classification.
        <br />
        <br />
        <strong>LoRA / PEFT:</strong> Efficient fine-tuning techniques that work without expensive GPUs.
        LoRA adds small trainable matrices to the model — you only train a fraction of the parameters
        but get great results.
      </>
    ),
  },
  {
    id: "bias",
    title: "What is AI bias and why does it matter?",
    tag: { label: "Ethics", kind: "warn" },
    focus: ["ethics"],
    keywords: "bias ethics fairness responsible ai discrimination gender race",
    body: (
      <>
        AI models learn from human-generated data. If that data reflects historical biases — racial,
        gender, socioeconomic — the model learns and amplifies those biases. A hiring algorithm trained
        on historical hiring data may discriminate against women if the past workforce was
        male-dominated.
        <br />
        <br />
        <strong>Real examples:</strong> Facial recognition systems that fail on darker skin tones; loan
        approval models that penalize certain zip codes; NLP systems that associate &quot;doctor&quot;
        with male pronouns.
        <br />
        <br />
        Studying and mitigating bias is a core professional responsibility for every AI practitioner.
      </>
    ),
  },
];

export interface Course {
  title: string;
  /** Checked when the learner has no saved progress yet */
  initiallyDone: boolean;
  /** Shows "In progress" instead of "Pending" while unchecked */
  inProgress?: boolean;
}

export const COURSES: Course[] = [
  { title: "What is AI? Key concepts and history", initiallyDone: true },
  { title: "Python basics — variables, loops, functions", initiallyDone: true },
  { title: "Introduction to machine learning concepts", initiallyDone: true },
  { title: "NumPy & Pandas for data manipulation", initiallyDone: false, inProgress: true },
  { title: "Linear regression & model evaluation", initiallyDone: false },
  { title: "Decision trees & random forests", initiallyDone: false },
  { title: "First ML project — train and deploy a model", initiallyDone: false },
  { title: "Neural network basics — perceptrons, backprop", initiallyDone: false },
  { title: "Intro to deep learning with PyTorch", initiallyDone: false },
  { title: "Transformers & how LLMs work", initiallyDone: false },
];

/** Bump this whenever UPDATES changes, so returning visitors see the "new" badge again. */
export const UPDATES_VERSION = "2026-10-10";
export const UPDATES_REVIEWED = "October 10, 2026";

export const UPDATES: { date: string; title: string; body: string; tags: Tag[] }[] = [
  {
    date: "2026",
    title: "Claude 5 family: Opus, Sonnet and Haiku",
    body: "Anthropic's current models come in three sizes. Try the free tier at claude.ai — it's especially good at explaining code and walking through reasoning step by step.",
    tags: [{ label: "New models", kind: "new" }, { label: "Free tier", kind: "info" }],
  },
  {
    date: "2026",
    title: "Gemini 2.5 Flash is closed to new API users — use Gemini 3.8 Flash",
    body: "New Google AI Studio keys can no longer call gemini-2.5-flash. If an old tutorial's code returns a 404, switch the model name to gemini-3.8-flash. Busy-hour 503 errors are common, so retry after a few seconds (this app does it for you).",
    tags: [{ label: "Builders", kind: "hot" }, { label: "Free API", kind: "info" }],
  },
  {
    date: "Jul 2025",
    title: "Papers with Code has shut down — use Hugging Face Papers",
    body: "Meta retired Papers with Code; its address now redirects to Hugging Face Trending Papers, which links research papers to their code. Note that the old benchmark leaderboards were not carried over.",
    tags: [{ label: "Research", kind: "warn" }],
  },
];

export const NEWS_SOURCES: { label: string; href: string }[] = [
  { label: "Hugging Face Papers", href: "https://huggingface.co/papers/trending" },
  { label: "The Batch (DeepLearning.AI)", href: "https://www.deeplearning.ai/the-batch/" },
  { label: "Import AI newsletter", href: "https://importai.substack.com" },
  { label: "Anthropic news", href: "https://www.anthropic.com/news" },
  { label: "Google AI blog", href: "https://blog.google/technology/ai/" },
  { label: "OpenAI news", href: "https://openai.com/news/" },
];
