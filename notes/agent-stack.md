# The AI coding agent stack

An AI coding agent is not a single thing you install. It is a stack of choices, and each
layer decides what the agent can do and how far it can reach. Each layer also answers a
limit left by the one before it.

## Model

The model is the reasoning core. It reads code, thinks through the problem, and works out
a solution. On its own, though, it has no way to touch your codebase. It can only reason
about what you put in front of it.

Three things matter most when choosing a model: intelligence, how well it reasons through
the problem; speed, how quickly it responds; and the context window, how much it can hold
in view at once (the same working memory described under Skills below). These pull against
each other, so the strongest model is not always the right one: a sharper model that is
slow, or whose window is too small for the job, may be the wrong pick.

Independent benchmarks make the trade-off concrete. A good starting point is Artificial
Analysis (<https://artificialanalysis.ai/>), which compares models on intelligence, speed
and price; each model's context-window size is listed in its own specifications.

## Coding tools

Coding tools give the model hands. They let it open files, run commands, and write code in
your repository. Now the agent can both think and act, but only with what is already
local to the project.

## MCPs

The Model Context Protocol connects the agent to the outside world: databases, browsers,
APIs, and other services, all through one standard protocol. Rather than building a
separate integration for every service, you configure one MCP server and the agent gains
access through it.

## Skills

The more an agent can do, the more instructions it needs, and every instruction spends
tokens from its context window, the fixed budget of text (measured in tokens, chunks of
roughly a word each) that the model can hold in view at once. Think of it as the agent's
working memory for a single request. It does not persist on its own: the model is stateless
between requests, so anything from earlier in the conversation stays available only if the
harness feeds that history back into the window on the next prompt. Because that history is
resent every turn, its tokens are paid for again on each request, so a longer conversation
costs more with every prompt. Skills fix this by
packaging
workflows into modules the agent loads only when it needs them. An agent with ten skills
does not carry all ten at once. It pulls in the relevant one, uses it, and moves on.

Skills are also more than a way to wrap tool calls. They package repeatable workflows,
guardrails, and project-specific habits, so the agent applies them the same way every
time rather than working each case out afresh.

## Subagents

Even a well-equipped agent eventually hits a ceiling. Long tasks fill the context window,
and earlier information starts to degrade. Subagents get past this by handing focused
tasks to separate agents that start clean, do the work, and report back. The main agent
keeps a sharp, uncluttered context.

## Where the harness fits

The layers above are the parts. The harness is the software that wires them together and
runs them: the loop that lets the model take a turn, call a tool, read the result, and
decide what to do next, plus the plumbing for context and memory, and the orchestration
that starts subagents and gathers their answers. The model on its own only reasons; the
harness is what turns that reasoning into a working agent.

This also explains why the line between an AI agent and agentic AI can feel blurry. It is
the same harness operating at two settings. A model with a harness running a single act
loop is one AI agent. The same harness coordinating several of those loops as subagents is
agentic AI. For how those two levels differ in scope and autonomy, see
[ai-agents-vs-agentic-ai.md](ai-agents-vs-agentic-ai.md).
