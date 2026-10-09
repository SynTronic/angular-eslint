# Glossary

Terms used when designing and discussing rules in this repository.

## Class map

The object literal that Angular reads as a class map in a `[class]` template binding: either the binding's top-level expression, or an expression reached from it only through parentheses or the result branches of `?:`, `??`, and `||`. An object literal that sits in a value position (for example `{ 'ok': flag() ? { 'a b': 1 } : null }`) is **not** a class map. `[ngClass]`, `[attr.class]` and host bindings are out of scope: `[ngClass]` splits keys on whitespace itself.

## Multi-token key

A key of a class map that contains whitespace (`\s`) and at least one non-whitespace character, including padded single tokens such as `' foo '`. Angular treats each key as exactly one class name and silently drops a key that contains a space (`classKeyValueArraySet` in `@angular/core`), so the class is never applied and no warning appears. Empty and whitespace-only keys are not multi-token keys. Spread entries are ignored.

## Split suggestion

An ESLint suggestion (not an autofix) that replaces one multi-token key with one key per token: the key is trimmed, split on `/\s+/`, and each token is written as a quoted key (using the original quote character, or `'` for unquoted keys) with a verbatim copy of the original condition's source text. Duplicates of existing keys are not merged. It is a suggestion only, because copying the condition can change how often it is evaluated.
