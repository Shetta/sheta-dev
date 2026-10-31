---
title: "AI can write the proof. It still cannot choose the theorem"
description: "What formal verification can and cannot establish when implementations, specifications, and proof attempts may all be machine-generated."
published: 2026-10-31
tags: [formal-methods, verification, distributed-systems, reliability, ai, tla-plus]
level: advanced
---

A language model can generate a lock implementation, its tests, a TLA+ model, and an explanation of why the design is safe before a reviewer has finished reading the first function.

That does not mean the lock is safe.

The implementation may be wrong. The model may omit the failing behavior. The safety property may be weaker than the requirement. The explanation may describe a system that neither the code nor the model implements.

Formal verification helps with one part of this problem: it turns a claim into an obligation that a machine can check. It does not decide whether we made the right claim.

When plausible code becomes cheap, the bottleneck moves from implementation to specification. Engineers must define behavior well enough to reject the wrong implementation.

## Plausible code is not evidence

Consider a worker that charges a payment and records completion:

```python
def process(operation_id: str, store: Store, payments: Payments) -> None:
    if store.is_completed(operation_id):
        return

    payments.charge(operation_id)
    store.mark_completed(operation_id)
```

The function is short. Its names are reasonable. A unit test with one worker and one delivery will pass.

Two workers can still execute this history:

```text
Worker A: is_completed -> false
Worker B: is_completed -> false
Worker A: charge
Worker B: charge
Worker A: mark_completed
Worker B: mark_completed
```

The mistake is not inside one line. It is in the set of permitted interleavings between two workers and two external systems.

Even “make it idempotent” is not yet a specification. We have to ask what identifies a logical operation, which effect must be unique, whether the payment provider honors an idempotency key, and what happens when the process dies between charging and recording completion.

## We first have to say what correct means

For this example, start with one safety property:

```text
For each logical operation, the payment effect occurs at most once.
```

That sentence already makes choices. It says *logical operation*, not delivery or attempt. It constrains the external effect, not merely the number of completion rows. It says nothing about whether a valid payment eventually happens.

The last omission is deliberate. These are different properties:

```text
Safety:  a bad event never happens.
         The operation is not charged twice.

Liveness: a desired event eventually happens.
          A claimed operation eventually completes.
```

A system can satisfy the safety property by never charging anyone. It can satisfy a weak completion property while charging the same customer twice. “Verified” is incomplete unless it names the property.

## A model checker finds the interleaving

TLA+ describes systems as state machines. It does not describe executable production code. Its common engineering tool, TLC, explores a finite model's reachable states and reports a trace when a checked property fails. [Leslie Lamport's TLA+ overview](https://lamport.azurewebsites.net/tla/high-level-view.html) distinguishes the specification from the finite TLC model used to check it.

Here is a small model of the flawed worker. Each worker reads the completion flag in one step, applies the effect in another, and records completion in a third.

```tla
--------------------------- MODULE DuplicateEffect ---------------------------
EXTENDS Naturals

CONSTANT Workers

VARIABLES pc, completed, effects

vars == <<pc, completed, effects>>

Init ==
    /\ pc = [w \in Workers |-> "Read"]
    /\ completed = FALSE
    /\ effects = 0

Read(w) ==
    /\ pc[w] = "Read"
    /\ pc' = [pc EXCEPT ![w] = IF completed THEN "Done" ELSE "Apply"]
    /\ UNCHANGED <<completed, effects>>

Apply(w) ==
    /\ pc[w] = "Apply"
    /\ effects' = effects + 1
    /\ pc' = [pc EXCEPT ![w] = "Mark"]
    /\ UNCHANGED completed

Mark(w) ==
    /\ pc[w] = "Mark"
    /\ completed' = TRUE
    /\ pc' = [pc EXCEPT ![w] = "Done"]
    /\ UNCHANGED effects

Next ==
    \E w \in Workers : Read(w) \/ Apply(w) \/ Mark(w)

Spec == Init /\ [][Next]_vars

TypeOK ==
    /\ pc \in [Workers -> {"Read", "Apply", "Mark", "Done"}]
    /\ completed \in BOOLEAN
    /\ effects \in Nat

AtMostOnce == effects <= 1
=============================================================================
```

A corresponding model configuration is small:

```tla
CONSTANT Workers = {w1, w2}

SPECIFICATION Spec

INVARIANT TypeOK
INVARIANT AtMostOnce
```

The model admits the same failure as the Python code:

```text
w1 reads completed = FALSE
w2 reads completed = FALSE
w1 increments effects to 1
w2 increments effects to 2
```

This is more useful than saying that concurrency is difficult. The trace identifies the permitted steps that violate `AtMostOnce`.

It is also a bounded result. TLC checks the finite instance supplied in the model, not every possible deployment size. The distinction between a TLA+ specification and a finite TLC model is explicit in the [TLA+ documentation](https://lamport.azurewebsites.net/tla/model-popup.html).

## The first fix trades liveness for safety

We can change the design so one worker claims the operation through an atomic action:

```tla
--------------------------- MODULE ClaimedEffect -----------------------------
EXTENDS Naturals

CONSTANT Workers

VARIABLES pc, state, effects

vars == <<pc, state, effects>>

Init ==
    /\ pc = [w \in Workers |-> "Claim"]
    /\ state = "pending"
    /\ effects = 0

Claim(w) ==
    /\ pc[w] = "Claim"
    /\ IF state = "pending"
          THEN /\ state' = "claimed"
               /\ pc' = [pc EXCEPT ![w] = "Apply"]
          ELSE /\ UNCHANGED state
               /\ pc' = [pc EXCEPT ![w] = "Done"]
    /\ UNCHANGED effects

Apply(w) ==
    /\ pc[w] = "Apply"
    /\ effects' = effects + 1
    /\ pc' = [pc EXCEPT ![w] = "Complete"]
    /\ UNCHANGED state

Complete(w) ==
    /\ pc[w] = "Complete"
    /\ state' = "completed"
    /\ pc' = [pc EXCEPT ![w] = "Done"]
    /\ UNCHANGED effects

Next ==
    \E w \in Workers : Claim(w) \/ Apply(w) \/ Complete(w)

Spec == Init /\ [][Next]_vars

AtMostOnce == effects <= 1
=============================================================================
```

Only the worker that changes `state` from `pending` to `claimed` reaches `Apply`. The design excludes the earlier double-effect trace.

But suppose that worker dies after `Claim` and before `Apply`. The operation remains claimed and no other worker can continue it. The safety fix has exposed a liveness problem.

Adding leases does not make the problem disappear. It adds clock assumptions, lease-expiration behavior, and a new race: the first worker may continue after another worker has reclaimed the operation. An external idempotency key may be the right boundary, but then the guarantee depends on the provider's documented semantics and retention period.

Formalization has not removed the tradeoff. It has made the tradeoff difficult to hide.

## The property can be valid and still be wrong

Suppose a generated specification checks this property:

```tla
NoExtraCompletionRows ==
    Cardinality(completedOperations) <= Cardinality(requestedOperations)
```

It might be true while the payment effect occurs twice. It constrains database rows, not charges.

Or suppose every retry receives a unique attempt identifier and the generated property says:

```text
Every payment attempt has a unique identifier.
```

That is compatible with charging once per attempt. The property is precise, checkable, and irrelevant to the original requirement.

An AI system can hide this failure by changing the implementation and the property together. The proof remains consistent because both artifacts drifted in the same direction.

The verifier may accept a proof of a theorem that no longer states the intended requirement.

## Preconditions can hide the difficult case

Deductive verification makes the same issue visible at function scale. Dafny methods can declare preconditions with `requires` and postconditions with `ensures`. Callers must establish the preconditions. Method bodies must establish the postconditions. The [Dafny guide](https://dafny.org/latest/OnlineTutorial/guide) demonstrates this contract.

Consider a withdrawal with a fee:

```dafny
method WithdrawWithFee(
  balance: nat,
  amount: nat,
  fee: nat
) returns (remaining: nat)
  requires amount <= balance
  ensures remaining == balance - amount - fee
{
  remaining := balance - amount - fee;
}
```

The contract permits this input:

```text
balance = 100
amount = 100
fee = 1
```

The body cannot establish its postcondition over natural numbers because the permitted withdrawal and fee exceed the balance together. One repair is:

```dafny
method WithdrawWithFee(
  balance: nat,
  amount: nat,
  fee: nat
) returns (remaining: nat)
  requires amount + fee <= balance
  ensures remaining == balance - amount - fee
  ensures remaining <= balance
{
  remaining := balance - amount - fee;
}
```

Dafny can check the implementation against that contract. It cannot decide whether declining the transaction is the intended product rule. Perhaps the system should waive the fee, permit an overdraft, or debit a second account. Strengthening a precondition can make verification succeed by excluding the case the business actually needed us to handle.

## Proof assistants check derivations, not intentions

A proof assistant provides another boundary. Lean elaborates definitions and proof scripts into terms checked by a small kernel. The [Lean reference manual](https://lean-lang.org/doc/reference/latest/Elaboration-and-Compilation/#the-kernel) describes the kernel as the trusted type checker for Lean's core theory.

That architecture is important in an AI setting. A generated proof can be large, unfamiliar, or obscure by design. An independent checker still validates the resulting proof term. Lean's guidance for [validating untrusted proofs](https://lean-lang.org/doc/reference/latest/ValidatingProofs/) recommends keeping the trusted theorem statement separate. For higher-risk cases, it recommends replaying exported proofs with the official kernel and an external checker.

The trusted statement remains the critical part. A checked proof of a weakened theorem is still a checked proof of a weakened theorem.

This gives us three separate review questions:

```text
1. Did the checker accept the derivation?
2. Does the theorem mean what its author claims?
3. Does that theorem describe the production requirement?
```

AI can help construct the derivation. It does not collapse the three questions into one.

## The model is not the deployment

Even the right property over the right model leaves a correspondence problem.

The model may treat an operation as atomic while the implementation uses two database calls. It may assume linearizable conditional writes while the selected storage operation offers weaker behavior. It may model a payment provider as remembering idempotency keys forever when the provider expires them. It may omit cancellation, clock movement, malformed input, quota enforcement, or an operator replaying a dead-letter queue.

None of this makes the model useless. A small model is useful because it omits details. The author must state which details the model abstracts and why the abstraction preserves the property under discussion.

Industrial experience at Amazon found value in using TLA+ on complex systems at this design level. The work reported subtle design errors and improved confidence before implementation. It did not claim that model checking replaced testing or verified every line of production code. [Newcombe et al., “How Amazon Web Services Uses Formal Methods”](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf)

## AI is useful around the checker

There are useful jobs for a language model here, provided its output remains reviewable.

It can translate prose into a *candidate* invariant:

```text
Prose:
A retry must not charge one logical operation more than once.

Candidate:
For every operation o, charges[o] <= 1.
```

It can propose adversarial behaviors that the first model omitted:

```text
Deliver the operation to two workers.
Crash after the effect but before completion.
Expire a lease while its worker is still running.
Lose the provider's success response.
Replay the operation after the idempotency record expires.
```

It can generate mutations to test the strength of a property. If removing the atomic claim or duplicating an effect violates no checked property, that result suggests the properties are too weak.

It can summarize a counterexample trace, suggest lemmas, or search a library for an existing theorem. Those are ways to reduce mechanical work. The original trace, theorem statement, assumptions, and checker result should remain available for inspection.

The verifier should be the authority on whether a proof checks. The language model should not grade its own output.

## State what was verified

“The system is formally verified” hides the useful information. A report should answer narrower questions:

1. **Claim:** What exact safety or liveness property was checked?
2. **Artifact:** Was the subject source code, bytecode, a protocol model, or a theorem?
3. **Method:** Was it explicit-state model checking, bounded model checking, symbolic execution, deductive verification, or proof checking?
4. **Scope:** Which operations, states, and failure modes were represented?
5. **Bounds:** Were process counts, queue sizes, values, or execution lengths finite?
6. **Assumptions:** What was assumed about storage, clocks, networks, fairness, and external services?
7. **Correspondence:** Why should the verified artifact represent the deployed implementation?
8. **Trusted base:** Which kernels, solvers, axioms, libraries, compilers, and runtimes remain trusted?
9. **Specification review:** Who checked that the formal property matches the intended requirement?

A precise report for the first model would look like this:

> TLC found a counterexample to `AtMostOnce` in a model with two workers whose read, effect, and completion steps may interleave.

After checking the corrected model over stated finite instances, the corresponding report should say:

> TLC found no violation of `AtMostOnce` in the checked finite instances after the model introduced an atomic claim. Crash recovery and correspondence with the external payment provider remain outside that result.

That wording is less impressive than “proved correct.” It is also evidence an engineer can evaluate.

## The specification is still the work

Generated code raises the rate at which plausible implementations arrive for review. Generated specifications and proof attempts can reduce some of the labor required to analyze them. Neither changes what a formal result means.

A checker can reject an invalid transition, exhibit a counterexample, or validate that a proof term establishes a theorem. It cannot tell us that `operation_id` identifies the business event we care about. It cannot decide whether at-most-once is preferable to eventual completion. It cannot discover an omitted requirement based only on properties that remain consistent with each other.

AI can write the implementation. It can propose the model. It may even write a proof that a small trusted kernel accepts.

It still cannot choose the theorem for us.

## References

1. Leslie Lamport: [A high-level view of TLA+](https://lamport.azurewebsites.net/tla/high-level-view.html)
2. Leslie Lamport: [TLA+ models versus TLC models](https://lamport.azurewebsites.net/tla/model-popup.html)
3. Chris Newcombe et al.: [How Amazon Web Services Uses Formal Methods](https://lamport.azurewebsites.net/tla/formal-methods-amazon.pdf)
4. Dafny: [Getting started: preconditions and postconditions](https://dafny.org/latest/OnlineTutorial/guide)
5. Lean: [The kernel](https://lean-lang.org/doc/reference/latest/Elaboration-and-Compilation/#the-kernel)
6. Lean: [Validating a Lean proof](https://lean-lang.org/doc/reference/latest/ValidatingProofs/)

