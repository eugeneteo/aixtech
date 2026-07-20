# AI agent vs Agentic AI

These two terms are often used as if they mean the same thing, but they describe
different levels of the same idea. The short version: an AI agent is a single doer that
handles one scoped task, while Agentic AI is a coordinated system of agents that plans
and works together on something larger. The framing below follows the taxonomy in
Sapkota, Roumeliotis and Karkee (2025).

Reference: "AI Agents vs. Agentic AI: A Conceptual Taxonomy, Applications and
Challenges", arXiv:2505.10468, <https://arxiv.org/abs/2505.10468>

## AI agent

An AI agent is usually a single, modular system built on a large language model, with
tools, prompting, and reasoning added on top. It is aimed at narrow, well-scoped work
such as customer support, scheduling, or summarising a document. It acts with moderate
autonomy on a defined instruction, tends to work one task at a time, and often keeps
only short-term memory of the job in hand. Its typical failure modes are hallucination
and brittleness when a task drifts outside its scope.

## Agentic AI

Agentic AI is a step up in autonomy and structure. Instead of one agent, several agents
work together under some form of orchestration. The system can break a goal into
sub-tasks, hold persistent memory across them, coordinate who does what, and adapt as it
goes, so behaviour can emerge that no single agent was scripted to produce. It suits
sustained, open-ended work such as research automation, robotic teamwork, or decision
support. Its harder problems are the flip side of that power: emergent behaviour,
coordination failures, and the complexity of orchestration.

## At a glance

| Aspect        | AI agent                              | Agentic AI                                  |
| ------------- | ------------------------------------- | ------------------------------------------- |
| Structure     | Single, modular agent                 | Multiple agents, orchestrated               |
| Task scope    | Narrow, well-scoped                   | Broad, decomposed into sub-tasks            |
| Memory        | Short-term                            | Persistent, shared across the system        |
| Autonomy      | Moderate, on a defined instruction    | High, coordinated across agents             |
| Typical uses  | Support, scheduling, summarising      | Research, robotics, decision support        |
| Main risks    | Hallucination, brittleness            | Emergent behaviour, coordination complexity |

## A note on usage

In everyday writing the two labels are used loosely, and plenty of products called
"agents" sit somewhere in between. The split above is a useful mental model from the
paper rather than a strict industry standard, so treat it as a way to reason about
autonomy and coordination, not a hard boundary.
