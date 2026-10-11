// The skill tree: every skill, its prerequisites, resources and quiz — plus the pure logic that
// decides what is locked, mastered and recommended next. No React here, so it's easy to test.

import type { Level } from "./content";

export type Tier = Level;

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index into `options` */
  answer: number;
  explain: string;
}

export interface Skill {
  id: string;
  title: string;
  emoji: string;
  tier: Tier;
  /** Row in the tree diagram (0 = top). Skills in the same row sit side by side. */
  row: number;
  prereqs: string[];
  summary: string;
  /** Id of a matching explainer card on the Topics tab */
  topic?: string;
  resources: { label: string; href: string }[];
  quiz: QuizQuestion[];
}

/** Score (in %) needed to master a skill */
export const PASS_MARK = 80;

export const TIERS: Tier[] = ["beginner", "intermediate", "advanced"];

export const SKILLS: Skill[] = [
  {
    id: "ai-basics",
    title: "What is AI?",
    emoji: "🤖",
    tier: "beginner",
    row: 0,
    prereqs: [],
    summary: "How AI, machine learning and deep learning relate, what today's AI can and can't do, and the milestones that got us here.",
    resources: [
      { label: "Elements of AI (free)", href: "https://www.elementsofai.com" },
      { label: "Coursera: AI for Everyone", href: "https://www.coursera.org/learn/ai-for-everyone" },
    ],
    quiz: [
      {
        q: "How are AI, machine learning and deep learning related?",
        options: [
          "Deep learning ⊂ machine learning ⊂ AI",
          "AI ⊂ machine learning ⊂ deep learning",
          "They are three unrelated fields",
          "Machine learning and AI are identical; deep learning is separate",
        ],
        answer: 0,
        explain: "Deep learning is one kind of machine learning, and machine learning is one approach to AI.",
      },
      {
        q: "Which of these is an example of “narrow AI”?",
        options: ["A spam filter", "A machine that can do any task a human can", "A self-aware robot", "Narrow AI doesn't exist yet"],
        answer: 0,
        explain: "Today's AI systems are narrow: each is built for specific tasks, like filtering spam.",
      },
      {
        q: "What does a machine-learning system mainly learn from?",
        options: ["Data and examples", "Only hand-written if/else rules", "Random guessing", "The computer's electricity use"],
        answer: 0,
        explain: "ML finds patterns in examples instead of following rules a programmer wrote by hand.",
      },
      {
        q: "The 2017 paper “Attention Is All You Need” introduced which architecture?",
        options: ["The Transformer", "The convolutional neural network", "The decision tree", "The perceptron"],
        answer: 0,
        explain: "The Transformer, which powers today's large language models.",
      },
    ],
  },
  {
    id: "python",
    title: "Python basics",
    emoji: "🐍",
    tier: "beginner",
    row: 0,
    prereqs: [],
    summary: "Variables, lists, loops, functions and dictionaries — the Python you need before any AI library.",
    resources: [
      { label: "CS50P (free)", href: "https://cs50.harvard.edu/python" },
      { label: "LearnPython.org", href: "https://www.learnpython.org" },
    ],
    quiz: [
      {
        q: "What does len([3, 5, 7]) return?",
        options: ["3", "7", "15", "An error"],
        answer: 0,
        explain: "len() counts the items in a list — there are 3.",
      },
      {
        q: "Which line correctly starts a function definition in Python?",
        options: ["def add(a, b):", "function add(a, b)", "func add(a, b):", "define add(a, b):"],
        answer: 0,
        explain: "Python functions start with the def keyword and end the line with a colon.",
      },
      {
        q: "What does `for i in range(3): print(i)` print?",
        options: ["0 1 2", "1 2 3", "0 1 2 3", "3"],
        answer: 0,
        explain: "range(3) produces 0, 1 and 2 — it stops before 3.",
      },
      {
        q: "Which built-in type stores key–value pairs?",
        options: ["dict", "list", "tuple", "set"],
        answer: 0,
        explain: "A dict maps keys to values, e.g. {\"name\": \"Ada\"}.",
      },
    ],
  },
  {
    id: "ethics",
    title: "AI ethics & bias",
    emoji: "⚖️",
    tier: "beginner",
    row: 1,
    prereqs: ["ai-basics"],
    topic: "bias",
    summary: "Where bias comes from, why fairness and explainability matter, and how responsible teams test their models.",
    resources: [
      { label: "Ethics of AI (free course)", href: "https://ethics-of-ai.mooc.fi" },
      { label: "Google Responsible AI", href: "https://ai.google/responsibility/responsible-ai-practices/" },
    ],
    quiz: [
      {
        q: "A hiring model trained on data from a male-dominated workforce rejects more women. This is mainly…",
        options: ["Historical bias in the training data", "Overfitting only", "A hardware bug", "Random noise"],
        answer: 0,
        explain: "The model learned the unfair patterns that were already in the historical data.",
      },
      {
        q: "Which practice helps reduce bias?",
        options: [
          "Measuring performance separately for different groups",
          "Deleting the test set",
          "Training for longer, nothing else",
          "Hiding how the model works",
        ],
        answer: 0,
        explain: "Checking results per group reveals when a model works well for some people but not others.",
      },
      {
        q: "In AI, “explainability” means…",
        options: [
          "Being able to understand why a model made a decision",
          "Making models run faster",
          "Collecting more data",
          "Encrypting the model",
        ],
        answer: 0,
        explain: "Explainable models let people check, question and trust their decisions.",
      },
      {
        q: "Why might facial recognition fail more often for some groups?",
        options: [
          "Those groups were under-represented in the training data",
          "Cameras can't photograph them",
          "It's pure chance",
          "Every model is always too small",
        ],
        answer: 0,
        explain: "A model can only learn well from what it has seen; gaps in data become gaps in accuracy.",
      },
    ],
  },
  {
    id: "math",
    title: "Math for ML",
    emoji: "📐",
    tier: "beginner",
    row: 1,
    prereqs: ["ai-basics"],
    summary: "Just enough linear algebra, statistics and calculus to understand how models learn.",
    resources: [
      { label: "3Blue1Brown: Linear algebra", href: "https://www.3blue1brown.com/topics/linear-algebra" },
      { label: "Khan Academy: Statistics", href: "https://www.khanacademy.org/math/statistics-probability" },
    ],
    quiz: [
      {
        q: "In machine learning, a dataset is often stored as a matrix where…",
        options: [
          "Rows are examples and columns are features",
          "Each cell is a whole image",
          "There is only one number",
          "Rows are learning rates",
        ],
        answer: 0,
        explain: "e.g. each row is a house, each column a feature like size or number of rooms.",
      },
      {
        q: "What does the gradient tell an optimizer?",
        options: [
          "The direction in which the loss increases fastest",
          "The model's accuracy",
          "The number of layers",
          "The size of the dataset",
        ],
        answer: 0,
        explain: "Gradient descent steps the opposite way to reduce the loss.",
      },
      {
        q: "What is the mean of 2, 4, 6 and 8?",
        options: ["5", "4", "6", "20"],
        answer: 0,
        explain: "(2 + 4 + 6 + 8) ÷ 4 = 20 ÷ 4 = 5.",
      },
      {
        q: "A probability is always between…",
        options: ["0 and 1", "−1 and 1", "0 and 100", "Any two numbers"],
        answer: 0,
        explain: "0 means impossible and 1 means certain (percentages are just ×100).",
      },
    ],
  },
  {
    id: "numpy-pandas",
    title: "NumPy & Pandas",
    emoji: "🧮",
    tier: "beginner",
    row: 1,
    prereqs: ["python"],
    summary: "Fast arrays with NumPy and data tables with pandas — loading, cleaning and exploring real data.",
    resources: [
      { label: "Kaggle: Pandas (free)", href: "https://www.kaggle.com/learn/pandas" },
      { label: "NumPy quickstart", href: "https://numpy.org/doc/stable/user/quickstart.html" },
    ],
    quiz: [
      {
        q: "What does np.array([1, 2, 3]) * 2 give?",
        options: ["array([2, 4, 6])", "[1, 2, 3, 1, 2, 3]", "An error", "12"],
        answer: 0,
        explain: "NumPy applies the operation to every element (unlike a Python list, which would repeat).",
      },
      {
        q: "A pandas DataFrame is best described as…",
        options: ["A table with labelled rows and columns", "A single number", "A chart", "A neural network"],
        answer: 0,
        explain: "Think of it as a spreadsheet you control with code.",
      },
      {
        q: "Which pandas method shows the first five rows?",
        options: ["df.head()", "df.top()", "df.first5()", "df.show()"],
        answer: 0,
        explain: "df.head() is usually the first thing you run on new data.",
      },
      {
        q: "Why is NumPy faster than a Python loop for maths on arrays?",
        options: [
          "It runs whole-array operations in optimized compiled code",
          "It always uses the GPU",
          "It skips some calculations",
          "It rounds the numbers",
        ],
        answer: 0,
        explain: "This is called vectorization: one call processes the whole array in fast C code.",
      },
    ],
  },
  {
    id: "ml-basics",
    title: "ML fundamentals",
    emoji: "📊",
    tier: "beginner",
    row: 2,
    prereqs: ["math", "numpy-pandas"],
    topic: "ml",
    summary: "Supervised vs unsupervised learning, train/test splits, and how to spot overfitting.",
    resources: [
      { label: "Kaggle: Intro to ML (free)", href: "https://www.kaggle.com/learn/intro-to-machine-learning" },
      { label: "Andrew Ng: ML Specialization", href: "https://www.coursera.org/specializations/machine-learning-introduction" },
    ],
    quiz: [
      {
        q: "Predicting house prices from past sales with known prices is…",
        options: ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Not machine learning"],
        answer: 0,
        explain: "The examples come with the right answers (labels), so it's supervised.",
      },
      {
        q: "Grouping customers by behaviour, with no labels, is…",
        options: ["Unsupervised learning (clustering)", "Supervised classification", "Regression", "Reinforcement learning"],
        answer: 0,
        explain: "With no labels, the model finds structure on its own — that's unsupervised.",
      },
      {
        q: "Why keep a separate test set?",
        options: [
          "To check how the model does on data it has never seen",
          "To make training faster",
          "As a backup copy",
          "It isn't needed",
        ],
        answer: 0,
        explain: "Scoring on training data alone hides whether the model really generalizes.",
      },
      {
        q: "A model scores 99% on training data but 60% on new data. This is…",
        options: ["Overfitting", "Underfitting", "A perfect model", "Impossible"],
        answer: 0,
        explain: "It memorized the training data instead of learning patterns that generalize.",
      },
    ],
  },
  {
    id: "regression",
    title: "Regression & evaluation",
    emoji: "📈",
    tier: "beginner",
    row: 3,
    prereqs: ["ml-basics"],
    summary: "Fitting lines to data, measuring error, and choosing the right metric for the job.",
    resources: [
      { label: "scikit-learn: Linear models", href: "https://scikit-learn.org/stable/modules/linear_model.html" },
      { label: "StatQuest (YouTube)", href: "https://www.youtube.com/@statquest" },
    ],
    quiz: [
      {
        q: "Linear regression predicts…",
        options: ["A continuous number, by fitting a line or plane", "Only categories", "Clusters", "Images"],
        answer: 0,
        explain: "e.g. a price or a temperature — any number on a scale.",
      },
      {
        q: "Mean Squared Error (MSE) measures…",
        options: [
          "The average squared difference between predictions and true values",
          "Accuracy as a percentage",
          "Training time",
          "The number of features",
        ],
        answer: 0,
        explain: "Squaring makes every error positive and punishes big mistakes more.",
      },
      {
        q: "For spam detection where only 1% of emails are spam, which is more useful than plain accuracy?",
        options: ["Precision and recall (or F1)", "MSE", "The learning rate", "The number of epochs"],
        answer: 0,
        explain: "A model that says “not spam” every time is 99% accurate but useless — precision and recall expose that.",
      },
      {
        q: "Gradient descent updates the weights by moving…",
        options: ["Opposite to the gradient of the loss", "Along the gradient", "Randomly", "Never — weights are fixed"],
        answer: 0,
        explain: "Going against the gradient walks downhill, towards lower loss.",
      },
    ],
  },
  {
    id: "trees",
    title: "Trees & forests",
    emoji: "🌳",
    tier: "beginner",
    row: 3,
    prereqs: ["ml-basics"],
    summary: "Decision trees, random forests and why combining many models often beats one.",
    resources: [
      { label: "Kaggle: Intermediate ML", href: "https://www.kaggle.com/learn/intermediate-machine-learning" },
      { label: "scikit-learn: Ensembles", href: "https://scikit-learn.org/stable/modules/ensemble.html" },
    ],
    quiz: [
      {
        q: "A decision tree makes a prediction by…",
        options: [
          "Asking a series of yes/no questions about the features",
          "Drawing one straight line",
          "Guessing randomly",
          "Averaging all the pixels",
        ],
        answer: 0,
        explain: "e.g. “Is size > 100 m²?” → “Has a garden?” → prediction.",
      },
      {
        q: "A random forest improves on a single tree by…",
        options: [
          "Combining many trees trained on random subsets of the data",
          "Using one extremely deep tree",
          "Removing all features",
          "Training without data",
        ],
        answer: 0,
        explain: "Many slightly different trees vote, which cancels out individual mistakes.",
      },
      {
        q: "A very deep decision tree is prone to…",
        options: ["Overfitting", "Underfitting", "Having no splits", "Running out of labels"],
        answer: 0,
        explain: "Enough splits can memorize every training example, noise included.",
      },
      {
        q: "Which Python library provides RandomForestClassifier?",
        options: ["scikit-learn", "matplotlib", "requests", "Flask"],
        answer: 0,
        explain: "from sklearn.ensemble import RandomForestClassifier",
      },
    ],
  },
  {
    id: "neural-nets",
    title: "Neural networks",
    emoji: "🧠",
    tier: "intermediate",
    row: 3,
    prereqs: ["ml-basics"],
    topic: "nn",
    summary: "Neurons, layers, activation functions and backpropagation — the building blocks of deep learning.",
    resources: [
      { label: "3Blue1Brown: Neural networks", href: "https://www.3blue1brown.com/topics/neural-networks" },
      { label: "TensorFlow Playground", href: "https://playground.tensorflow.org" },
    ],
    quiz: [
      {
        q: "What does an activation function like ReLU add to a network?",
        options: ["Non-linearity, so it can learn complex patterns", "More training data", "Faster disks", "Labels"],
        answer: 0,
        explain: "Without it, any stack of layers would collapse into a single straight-line model.",
      },
      {
        q: "Backpropagation is used to…",
        options: [
          "Compute the gradient of the loss for every weight",
          "Collect training data",
          "Draw the network",
          "Deploy the model",
        ],
        answer: 0,
        explain: "It applies the chain rule backwards through the layers; the optimizer then uses those gradients.",
      },
      {
        q: "The learning rate controls…",
        options: ["How big each weight-update step is", "The number of layers", "The dataset size", "The final accuracy directly"],
        answer: 0,
        explain: "Too high and training jumps around; too low and it crawls.",
      },
      {
        q: "A network with many hidden layers is called…",
        options: ["Deep", "Wide", "Shallow", "Sparse"],
        answer: 0,
        explain: "That's the “deep” in deep learning.",
      },
    ],
  },
  {
    id: "mlops",
    title: "Deploying ML",
    emoji: "🚀",
    tier: "intermediate",
    row: 4,
    prereqs: ["regression", "trees"],
    summary: "Turning a notebook into a real service: APIs, Docker, monitoring and data drift.",
    resources: [
      { label: "Made With ML", href: "https://madewithml.com" },
      { label: "Hugging Face Spaces", href: "https://huggingface.co/spaces" },
    ],
    quiz: [
      {
        q: "What does it mean to “deploy” a model?",
        options: [
          "Make it available to real users, e.g. behind an API",
          "Delete it",
          "Train it again from scratch",
          "Plot its results",
        ],
        answer: 0,
        explain: "Deployment moves a model from your notebook to a service people can call.",
      },
      {
        q: "“Data drift” means…",
        options: [
          "Real-world data changes over time, so accuracy can drop",
          "Data moved to another disk",
          "The model file is too big",
          "Training is slow",
        ],
        answer: 0,
        explain: "That's why deployed models are monitored and retrained.",
      },
      {
        q: "Which tool packages an app with its dependencies so it runs the same everywhere?",
        options: ["Docker", "Excel", "Photoshop", "A USB stick"],
        answer: 0,
        explain: "A Docker image bundles the code, libraries and settings together.",
      },
      {
        q: "Why track experiments (settings and metrics) while training?",
        options: [
          "To compare runs and reproduce the best model",
          "To slow training down",
          "It's required by law",
          "To save electricity",
        ],
        answer: 0,
        explain: "Without records you can't tell which settings produced your best model.",
      },
    ],
  },
  {
    id: "deep-learning",
    title: "Deep learning (PyTorch)",
    emoji: "🔥",
    tier: "intermediate",
    row: 4,
    prereqs: ["neural-nets"],
    summary: "Tensors, training loops, epochs and GPUs — building and training real networks in PyTorch.",
    resources: [
      { label: "PyTorch tutorials", href: "https://pytorch.org/tutorials/" },
      { label: "fast.ai course (free)", href: "https://course.fast.ai" },
    ],
    quiz: [
      {
        q: "PyTorch's main data structure is the…",
        options: ["Tensor", "DataFrame", "Spreadsheet", "String"],
        answer: 0,
        explain: "A tensor is an n-dimensional array that can live on a GPU and track gradients.",
      },
      {
        q: "What does loss.backward() do?",
        options: ["Computes the gradients", "Updates the dataset", "Saves the model", "Prints the loss"],
        answer: 0,
        explain: "It fills in .grad for each weight; optimizer.step() then applies the update.",
      },
      {
        q: "One “epoch” is…",
        options: ["One full pass through the training data", "One batch", "One layer", "One prediction"],
        answer: 0,
        explain: "Training usually runs for many epochs.",
      },
      {
        q: "Why are GPUs used for deep learning?",
        options: [
          "They run many matrix operations in parallel",
          "They have more storage",
          "Python requires them",
          "They're cheaper than CPUs",
        ],
        answer: 0,
        explain: "Neural networks are mostly matrix maths, which GPUs do thousands of at once.",
      },
    ],
  },
  {
    id: "cnn",
    title: "Computer vision (CNNs)",
    emoji: "👁️",
    tier: "intermediate",
    row: 5,
    prereqs: ["deep-learning"],
    summary: "Convolutions, pooling, transfer learning and data augmentation for image tasks.",
    resources: [
      { label: "Stanford CS231n notes", href: "https://cs231n.github.io" },
      { label: "fast.ai course (free)", href: "https://course.fast.ai" },
    ],
    quiz: [
      {
        q: "Convolutional layers suit images because they…",
        options: [
          "Detect local patterns like edges anywhere in the image",
          "Read the text in images",
          "Sort the pixels",
          "Remove the colours",
        ],
        answer: 0,
        explain: "The same small filter slides across the image, so a pattern is found wherever it appears.",
      },
      {
        q: "Pooling layers mainly…",
        options: ["Shrink the feature maps", "Add labels", "Increase the resolution", "Replace convolutions"],
        answer: 0,
        explain: "e.g. max-pooling keeps the strongest signal in each small region.",
      },
      {
        q: "Starting from a model pre-trained on ImageNet for your own task is called…",
        options: ["Transfer learning", "Overfitting", "Clustering", "Tokenization"],
        answer: 0,
        explain: "You reuse what it already learned and only fine-tune for your data.",
      },
      {
        q: "Data augmentation (random flips, crops) helps because it…",
        options: [
          "Gives the model more varied examples, reducing overfitting",
          "Labels the data automatically",
          "Makes predictions faster",
          "Shrinks the model",
        ],
        answer: 0,
        explain: "The model learns that a flipped cat is still a cat.",
      },
    ],
  },
  {
    id: "transformers",
    title: "Transformers & attention",
    emoji: "⚡",
    tier: "intermediate",
    row: 5,
    prereqs: ["deep-learning"],
    topic: "llm",
    summary: "Tokens, self-attention and positional encodings — the architecture behind modern language models.",
    resources: [
      { label: "The Illustrated Transformer", href: "https://jalammar.github.io/illustrated-transformer/" },
      { label: "Hugging Face LLM course", href: "https://huggingface.co/learn/llm-course" },
    ],
    quiz: [
      {
        q: "Self-attention lets each token…",
        options: [
          "Weigh how relevant every other token is to it",
          "See only the token before it",
          "Ignore the context",
          "Count the characters",
        ],
        answer: 0,
        explain: "That's how “it” in a sentence can link back to the right noun.",
      },
      {
        q: "Text is split into small units called…",
        options: ["Tokens", "Pixels", "Epochs", "Batches"],
        answer: 0,
        explain: "A token is a word or a piece of a word.",
      },
      {
        q: "Why do transformers need positional encodings?",
        options: [
          "Attention alone doesn't know the order of the words",
          "To compress the text",
          "To speed up GPUs",
          "To translate languages",
        ],
        answer: 0,
        explain: "“Dog bites man” and “man bites dog” would otherwise look the same.",
      },
      {
        q: "Compared with RNNs, transformers train faster mainly because they…",
        options: [
          "Process all tokens of a sequence in parallel",
          "Have no weights",
          "Need less data",
          "Don't need GPUs",
        ],
        answer: 0,
        explain: "RNNs read one token at a time; transformers look at the whole sequence at once.",
      },
    ],
  },
  {
    id: "llms",
    title: "LLMs & prompting",
    emoji: "💬",
    tier: "advanced",
    row: 6,
    prereqs: ["transformers"],
    topic: "prompt",
    summary: "How large language models are trained and how to prompt them well — and where they go wrong.",
    resources: [
      { label: "Prompt Engineering Guide", href: "https://www.promptingguide.ai" },
      {
        label: "Anthropic: Prompt engineering",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
      },
    ],
    quiz: [
      {
        q: "At its core, an LLM is trained to…",
        options: ["Predict the next token", "Search the internet", "Store a database", "Only translate text"],
        answer: 0,
        explain: "Repeating that one task over huge amounts of text teaches language, facts and reasoning patterns.",
      },
      {
        q: "Including 2–3 examples of the output you want in your prompt is called…",
        options: ["Few-shot prompting", "Fine-tuning", "Zero-shot prompting", "Pre-training"],
        answer: 0,
        explain: "Examples show the model the exact format and style you expect.",
      },
      {
        q: "When an LLM confidently states something false, it's called…",
        options: ["A hallucination", "Overfitting", "A token", "Attention"],
        answer: 0,
        explain: "Always verify important facts an LLM gives you.",
      },
      {
        q: "An LLM's “context window” is…",
        options: [
          "The maximum amount of text it can consider at once",
          "The chat window on screen",
          "Its training dataset",
          "Its GPU's memory",
        ],
        answer: 0,
        explain: "Your prompt, any documents and the reply all have to fit inside it.",
      },
    ],
  },
  {
    id: "rag",
    title: "RAG",
    emoji: "🔎",
    tier: "advanced",
    row: 7,
    prereqs: ["llms"],
    topic: "rag",
    summary: "Embeddings, vector search and chunking — giving an LLM the right documents at the right time.",
    resources: [
      { label: "LangChain RAG tutorial", href: "https://python.langchain.com/docs/tutorials/rag/" },
      { label: "Pinecone: What is RAG?", href: "https://www.pinecone.io/learn/retrieval-augmented-generation/" },
    ],
    quiz: [
      {
        q: "RAG improves answers by…",
        options: [
          "Retrieving relevant documents and adding them to the prompt",
          "Retraining the model for every question",
          "Making the model bigger",
          "Removing the context",
        ],
        answer: 0,
        explain: "The model answers from fresh, relevant text instead of memory alone.",
      },
      {
        q: "Embeddings are…",
        options: [
          "Number vectors that capture meaning, so similar texts end up close together",
          "Images",
          "Passwords",
          "File names",
        ],
        answer: 0,
        explain: "Vector search finds the chunks whose embeddings are closest to the question's.",
      },
      {
        q: "Why split documents into chunks before indexing them?",
        options: [
          "So retrieval finds small, relevant pieces that fit in the context",
          "To delete data",
          "To encrypt them",
          "It isn't needed",
        ],
        answer: 0,
        explain: "Whole books won't fit in a prompt; the right paragraph will.",
      },
      {
        q: "A big advantage of RAG over fine-tuning for company knowledge is…",
        options: [
          "Easy updates — change the documents, no retraining",
          "It needs no data",
          "It's always free",
          "It doesn't need an LLM",
        ],
        answer: 0,
        explain: "When a policy changes, you just update the document store.",
      },
    ],
  },
  {
    id: "fine-tuning",
    title: "Fine-tuning & LoRA",
    emoji: "🎛️",
    tier: "advanced",
    row: 7,
    prereqs: ["llms"],
    topic: "finetune",
    summary: "Adapting pre-trained models to your task cheaply with LoRA — and when not to fine-tune at all.",
    resources: [
      { label: "Hugging Face PEFT docs", href: "https://huggingface.co/docs/peft" },
      { label: "Hugging Face LLM course", href: "https://huggingface.co/learn/llm-course" },
    ],
    quiz: [
      {
        q: "Fine-tuning means…",
        options: [
          "Continuing to train a pre-trained model on your own data",
          "Training a model from scratch",
          "Only writing better prompts",
          "Deleting layers",
        ],
        answer: 0,
        explain: "The model keeps its general knowledge and adapts to your task.",
      },
      {
        q: "LoRA makes fine-tuning cheaper by…",
        options: [
          "Training small added low-rank matrices instead of every weight",
          "Using no GPU at all",
          "Skipping the training data",
          "Removing attention",
        ],
        answer: 0,
        explain: "Only a tiny fraction of parameters is trained, so it fits on modest hardware.",
      },
      {
        q: "When is RAG usually a better choice than fine-tuning?",
        options: [
          "When the knowledge changes often",
          "When you want a new writing style",
          "Never",
          "When you have no documents",
        ],
        answer: 0,
        explain: "Fine-tuning is better for style and behaviour; RAG for up-to-date facts.",
      },
      {
        q: "Training a model to follow instructions using human preference ratings is called…",
        options: ["RLHF", "LoRA", "Tokenization", "Pooling"],
        answer: 0,
        explain: "Reinforcement Learning from Human Feedback.",
      },
    ],
  },
  {
    id: "agents",
    title: "AI agents & tools",
    emoji: "🛠️",
    tier: "advanced",
    row: 7,
    prereqs: ["llms"],
    summary: "Function calling, agent loops and safety — how LLMs take actions (like this app's AI Mentor).",
    resources: [
      { label: "Anthropic: Building effective agents", href: "https://www.anthropic.com/research/building-effective-agents" },
      { label: "Gemini function calling", href: "https://ai.google.dev/gemini-api/docs/function-calling" },
    ],
    quiz: [
      {
        q: "What turns an LLM into an “agent”?",
        options: [
          "It can decide to call tools and take actions in a loop to reach a goal",
          "It is very large",
          "It has a chat interface",
          "It is open source",
        ],
        answer: 0,
        explain: "Agents plan, act through tools, observe the result and continue.",
      },
      {
        q: "In function calling, who actually runs the function?",
        options: [
          "Your application — the model only asks for it, with arguments",
          "The model, on its own servers",
          "The user, by hand",
          "Nobody",
        ],
        answer: 0,
        explain: "The model replies with a structured request; your code decides whether and how to run it.",
      },
      {
        q: "Why should agents ask before risky actions?",
        options: [
          "Models can make mistakes, so people should approve irreversible steps",
          "It's faster",
          "It saves tokens",
          "It's always legally required",
        ],
        answer: 0,
        explain: "Keep a human in the loop for anything hard to undo.",
      },
      {
        q: "The AI Mentor in this app marking a skill as done for you is an example of…",
        options: ["Tool use", "Fine-tuning", "Pre-training", "Clustering"],
        answer: 0,
        explain: "The mentor calls an app function — that's tool use (function calling).",
      },
    ],
  },
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const SKILL_IDS = SKILLS.map((s) => s.id);
export const ROW_COUNT = Math.max(...SKILLS.map((s) => s.row)) + 1;

// ─── Progress ───────────────────────────────────────────────────────────────────

export interface SkillProgress {
  /** Completed — by passing the quiz, or marked as already known */
  done: boolean;
  /** Completed by "I already know this" rather than the quiz */
  manual: boolean;
  /** Best quiz score in %, or null if never attempted */
  best: number | null;
  attempts: number;
  doneAt?: string;
}

export type ProgressMap = Record<string, SkillProgress>;

export type SkillStatus = "mastered" | "known" | "in-progress" | "available" | "locked";

export const EMPTY_PROGRESS: SkillProgress = { done: false, manual: false, best: null, attempts: 0 };

export function progressOf(map: ProgressMap, id: string): SkillProgress {
  return map[id] ?? EMPTY_PROGRESS;
}

export function isDone(map: ProgressMap, id: string): boolean {
  return progressOf(map, id).done;
}

export function isUnlocked(map: ProgressMap, id: string): boolean {
  return (SKILL_BY_ID[id]?.prereqs ?? []).every((p) => isDone(map, p));
}

export function statusOf(map: ProgressMap, id: string): SkillStatus {
  const p = progressOf(map, id);
  if (p.done) return p.manual ? "known" : "mastered";
  if (!isUnlocked(map, id)) return "locked";
  return p.attempts > 0 ? "in-progress" : "available";
}

export function doneCount(map: ProgressMap, tier?: Tier): number {
  return SKILLS.filter((s) => (!tier || s.tier === tier) && isDone(map, s.id)).length;
}

/** Applies a finished quiz: keeps the best score and marks the skill done once it passes. */
export function applyQuizResult(map: ProgressMap, id: string, score: number, now: Date): ProgressMap {
  const prev = progressOf(map, id);
  const passed = score >= PASS_MARK;
  const next: SkillProgress = {
    ...prev,
    attempts: prev.attempts + 1,
    best: Math.max(prev.best ?? 0, score),
  };
  if (passed && (!prev.done || prev.manual)) {
    next.done = true;
    next.manual = false; // quiz-verified now
    next.doneAt = prev.doneAt ?? now.toISOString();
  }
  return { ...map, [id]: next };
}

export function markKnown(map: ProgressMap, id: string, now: Date): ProgressMap {
  const prev = progressOf(map, id);
  if (prev.done) return map;
  return { ...map, [id]: { ...prev, done: true, manual: true, doneAt: now.toISOString() } };
}

export function resetSkill(map: ProgressMap, id: string): ProgressMap {
  const next = { ...map };
  delete next[id];
  return next;
}

// ─── Adaptive path ──────────────────────────────────────────────────────────────

export interface Recommendation {
  skill: Skill;
  reason: string;
}

const tierIndex = (tier: Tier) => TIERS.indexOf(tier);

/** The best next skill: retry a failed quiz first, then the unlocked skill closest to the chosen level. */
export function recommend(map: ProgressMap, level: Tier): Recommendation | null {
  const candidates = SKILLS.filter((s) => !isDone(map, s.id) && isUnlocked(map, s.id));
  if (!candidates.length) return null;

  const levelIdx = tierIndex(level);
  const order = (s: Skill) => SKILLS.indexOf(s);
  candidates.sort((a, b) => {
    const triedA = progressOf(map, a.id).attempts > 0 ? 0 : 1;
    const triedB = progressOf(map, b.id).attempts > 0 ? 0 : 1;
    if (triedA !== triedB) return triedA - triedB;
    const distA = Math.abs(tierIndex(a.tier) - levelIdx);
    const distB = Math.abs(tierIndex(b.tier) - levelIdx);
    if (distA !== distB) return distA - distB;
    if (a.row !== b.row) return a.row - b.row;
    return order(a) - order(b);
  });

  const skill = candidates[0];
  const p = progressOf(map, skill.id);
  let reason: string;
  if (p.attempts > 0) {
    reason = `You scored ${p.best}% — one more try to reach ${PASS_MARK}% and master it.`;
  } else if (skill.prereqs.length) {
    const names = skill.prereqs.map((id) => SKILL_BY_ID[id].title);
    reason = `Unlocked because you finished ${names.join(" and ")}.`;
  } else {
    reason = "A great place to start — no prerequisites needed.";
  }
  return { skill, reason };
}

/** The next `count` skills in learning order, as if each recommendation were completed in turn. */
export function learningPath(map: ProgressMap, level: Tier, count: number): Skill[] {
  const path: Skill[] = [];
  let sim = map;
  for (let i = 0; i < count; i++) {
    const rec = recommend(sim, level);
    if (!rec) break;
    path.push(rec.skill);
    sim = { ...sim, [rec.skill.id]: { ...progressOf(sim, rec.skill.id), done: true } };
  }
  return path;
}

// ─── Migration from the old 10-item checklist ──────────────────────────────────

/** Index in the old `ain_progress` checklist → skill id */
export const LEGACY_CHECKLIST_SKILLS = [
  "ai-basics",
  "python",
  "ml-basics",
  "numpy-pandas",
  "regression",
  "trees",
  "mlops",
  "neural-nets",
  "deep-learning",
  "transformers",
];

export function migrateLegacyChecklist(saved: unknown, now: Date): ProgressMap {
  const map: ProgressMap = {};
  if (!Array.isArray(saved)) return map;
  saved.forEach((checked, i) => {
    const id = LEGACY_CHECKLIST_SKILLS[i];
    if (checked && id) map[id] = { done: true, manual: true, best: null, attempts: 0, doneAt: now.toISOString() };
  });
  return map;
}

/** Keeps only valid entries from storage (it may be old, edited or corrupted). */
export function sanitizeProgress(raw: unknown): ProgressMap {
  const map: ProgressMap = {};
  if (!raw || typeof raw !== "object") return map;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!SKILL_BY_ID[id] || !value || typeof value !== "object") continue;
    const v = value as Partial<SkillProgress>;
    map[id] = {
      done: v.done === true,
      manual: v.manual === true,
      best: typeof v.best === "number" && v.best >= 0 && v.best <= 100 ? v.best : null,
      attempts: typeof v.attempts === "number" && v.attempts >= 0 ? Math.floor(v.attempts) : 0,
      ...(typeof v.doneAt === "string" ? { doneAt: v.doneAt } : {}),
    };
  }
  return map;
}
