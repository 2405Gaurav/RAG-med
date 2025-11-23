MedRAG-Agent: A Multi-Agent, Knowledge Graph-Enhanced RAG Framework for High-Fidelity Medical Query Resolution

This repository contains the implementation of MedRAG-Agent, a state-of-the-art multi-agent Retrieval-Augmented Generation (RAG) system designed to significantly improve medical question-answering fidelity, reduce hallucinations, and enhance reasoning transparency.

MedRAG-Agent integrates:

A Knowledge Graph (KG) for structured medical reasoning

A Multi-Agent Architecture for decomposed, human-like decision-making

A Hybrid Medical Knowledge Base created from PubMed and MedlinePlus

Verification-driven answer generation to ensure factual grounding

This project is based on the research work:
“MedRAG-Agent: A Multi-Agent, Knowledge Graph-Enhanced RAG Framework for High-Fidelity Medical Query Resolution”
Authored by Vikas, Gaurav, Ashmit & Shivam 

RAG_BASED_MEDICAL_QUERY (1)

.

📌 Key Features
✅ 1. Multi-Agent RAG Pipeline

MedRAG-Agent uses four specialized intelligent agents:

Query Decomposer Agent
Breaks a complex medical query into simpler sub-questions.

Knowledge Graph Navigator Agent
Uses a biomedical KG (UMLS-aligned) to identify entities & relationships to narrow the search space.

Document Retriever Agent
Retrieves the top evidence chunks using MedCPT embeddings + FAISS.

Synthesizer & Verifier Agent
Produces the final answer AND verifies every claim with citations — reducing hallucinations by ~15%.

✅ 2. Knowledge Graph–Enhanced Retrieval

Instead of relying solely on vector similarity, the system uses a KG to:

Guide retrieval

Reduce noise

Improve relevance

Support multi-hop reasoning

This directly addresses the “retrieval challenge” in medical RAG systems 

RAG_BASED_MEDICAL_QUERY (1)

.

✅ 3. Hybrid Medical Knowledge Base

Constructed from:

PubMed abstracts (latest biomedical research)

MedlinePlus corpus (medically verified public health info)

Includes:

Structure-aware chunking

Named Entity Recognition

UMLS-based relation normalization

✅ 4. State-of-the-Art Performance (MedQA / MIRAGE Benchmark)
Model	Accuracy	Faithfulness	Completeness
MedRAG-Agent	78.5%	95.2%	4.45/5
Vanilla RAG	66.5%	82.5%	3.90
i-MedRAG	4.15	88.1%	4.20
KG-RAG	4.05	91.3%	4.10

Results sourced from the MedRAG-Agent evaluation in the paper 

RAG_BASED_MEDICAL_QUERY (1)

.

🧠 Architecture Overview
User Query
     ↓
[1] Query Decomposer Agent
     ↓
[2] KG Navigator Agent
     ↓
[3] Document Retriever Agent (MedCPT + FAISS)
     ↓
[4] Synthesizer & Verifier Agent
     ↓
Final Answer (Cited, Verified, Faithful)


This design mimics how clinicians approach complex reasoning tasks.

🛠️ Tech Stack
Core AI Components

MedCPT biomedical embedding model

Large Language Models (GPT-4o / Claude 3.5 Sonnet)

FAISS vector search

KG + NLP

UMLS mapping

Named Entity Recognition

Knowledge graph construction

Frameworks

LangChain for agent orchestration

Node.js / Express backend server

Docker + Qdrant/FAISS environment

🚀 Getting Started
1. Clone Repository
git clone <repository-url>
cd medrag-agent

2. Install Dependencies
npm install

3. Setup Environment Variables
LLM_API_KEY=YOUR_MODEL_API_KEY
QDRANT_URL=http://localhost:6333
PORT=3000

4. Start Vector DB
docker-compose -f docker-compose.db.yml up -d

5. Run Development Server
npm run dev

📘 API Endpoints
1. Submit Medical Query

POST /api/medrag/query

{
  "query": "What are the complications of untreated hyperthyroidism?"
}

2. Load Medical Corpus

POST /api/medrag/upload

Uploads structured or unstructured text (PubMed, MedlinePlus).

📂 Project Structure
.
├── src/
│   ├── agents/
│   │   ├── decomposer.ts
│   │   ├── kg-navigator.ts
│   │   ├── retriever.ts
│   │   └── verifier.ts
│   ├── kg/
│   ├── retriever/
│   ├── controller/
│   ├── router/
│   └── server.ts
├── docker-compose.db.yml
├── package.json
├── tsconfig.json
└── README.md

📈 Ablation Insights

Removing agents yields significant drops:

Removed Component	Accuracy	Faithfulness
KG Navigator	3.85	88.1%
Verifier Agent	4.25	85.9%
Query Decomposer	4.12	93.5%

This confirms the critical role of KG grounding and verification 

RAG_BASED_MEDICAL_QUERY (1)

.

🧪 Benchmarking

Dataset: MedQA (USMLE)

Evaluation Suite: MIRAGE Benchmark

Metrics:

Answer Accuracy

Faithfulness

Completeness

🧭 Future Work

As described in the paper:

Add multimodal RAG (radiology images, pathology slides)

Connect lab results, EHR data, genomics

Real-time dynamic knowledge updates

Deployment in clinical environments
