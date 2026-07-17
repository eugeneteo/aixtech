# Context engineering

Notes on managing the context an agent works with: how much text it can hold, how that
context degrades as a conversation grows, and why.

## Tokens

Models read and write text in tokens, not words. A useful rule of thumb is that **1,000
tokens is about 750 words of English prose**, or roughly three quarters of a word per
token for common English. Treat it as an approximation for budgeting prompt and response
length, not an exact count.

Reference: <https://platform.openai.com/tokenizer>

## Context rot

The longer a conversation runs, the harder an agent finds it to hold on to instructions
given earlier, so its answers drift and grow less reliable. This slow decline in coherence
is commonly called context rot. It is one reason to keep prompts focused and to restate the
essentials when a thread gets long.

### Why it happens

1. **Finite attention budget.** A model spreads a fixed amount of attention across every
   token in the window. As the conversation grows, each earlier instruction competes with
   far more text and receives a smaller share, so it carries less weight in the next reply.
2. **Recency dominance.** Models lean on the most recent tokens, so newer messages tend to
   crowd out older ones. Instructions set early in a long thread are the first to fade, and
   details buried in the middle are used least reliably.
3. **Error accumulation.** Each turn builds on the text before it, including the model's own
   earlier output. A small misreading or wrong assumption is carried forward and compounded,
   so mistakes propagate and grow across turns.


## Compaction

Compaction is automatic. When a conversation grows large enough to approach the context
window limit, the CLI runtime summarises the earlier turns to free up space, so work can
continue without losing the thread. It is a runtime mechanism rather than something the
agent chooses to do. The repository and files stay untouched; only the in-memory
conversation history is condensed, which is why a recap of the session appears afterwards.
