# Reflection

**Vicky Yan / vyy:**

**Recitation group members (Task 2): Justin Ku, Nehemia Yonas**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

`returns exactly five colors from G, Y, B` (invariant). Kills no public
mutant since every planted bug still returns five valid colors, but still valid because
the spec says "returns five colors, one per position of `guess`". It would
catch an off-by-one loop (`i <= 5`) that appends a sixth color.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

singlePass versus credits each letter exactly min(guess count, secret count) times: the bug only shows up when the guess repeats a letter that also appears in the secret. Because word draws from 26 letters, repeats are rare, so the mutant was killed only some of the time

```
  ~ singlePass     flaky: killed in 4/5 runs  by: credits each letter exactly min(guess count, secret count) times
      Counterexample: ["ASAAA","AAAAA"]
Mutation score: 4/5 killed (80%)
```

Fix: targeted generator `smallWord` over `{A, B, C}`, so every word repeats a
letter:

```
  ✔ singlePass     killed  by: credits each letter exactly min(guess count, secret count) times
      Counterexample: ["AAAAB","AAABB"]
Mutation score: 5/5 killed (100%)
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ mergesIntegerNeighbors  killed  by: returns already-disjoint sorted input unchanged
      Counterexample: [[[-19,-19],[-18,-18]]]
      AssertionError: expected [ [ -19, -18 ] ] to deeply equal [ [ -19, -19 ], [ -18, -18 ] ]
```

Counterexample: [[-19,-19],[-18,-18]]. The mutant returns [[-19,-18]] instead of the input. The spec requires the output to cover exactly the input’s points, and “points” means all real numbers. -18.5 lies in neither interval, but [-19,-18] covers it, so the two intervals must stay separate, as with the spec’s [1,2] and [3,4] example.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

One module that would benefit from PBT is the `read` tool in opencode (`packages/opencode/src/tool/read.ts`)

- **Invariant.** The output has at most `limit` lines, and every returned line
  equals the corresponding line of the original file.
- **Algebraic.** Reading lines `[0, n)` and then `[n, m)` and concatenating the
  results gives the same lines as reading `[0, m)` in one call.

**Generator.** Generate a list of random lines, join them with newlines to form
a file, and then pick `offset` and `limit` from the file's actual line count.
A naive generator that picks `offset` and `limit` independently would mostly
read past the end of the file and test nothing. It would also miss the edge
cases that matter: an empty file, a single line, and a file with a trailing
newline.