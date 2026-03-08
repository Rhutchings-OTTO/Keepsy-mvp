# Audit 17: Input Lag Fix — /create Page Textarea

## Problem

The textarea on `/create` was a controlled input whose `onChange` called `setPrompt` on the parent component `MerchGeneratorPlatform`. Every keystroke triggered a full re-render of `MerchGeneratorPlatform` and its entire child tree, including:

- `CreatePageLayoutLean` (the whole form layout)
- `BeforeAfterCarousel`
- `IdeasForYou`
- `PromptHelperCollapsible`
- `Carousel` (reviews section)
- `MagicpathFrame`
- All `motion.section` / `motion.div` animated wrappers

`MerchGeneratorPlatform` is a large component (~1200 lines) with many `useState` values and heavy sub-components. Re-rendering it on every keystroke caused visible input lag, especially on lower-end devices.

## Root Cause

`prompt` state lived in `MerchGeneratorPlatform`. The textarea in `CreatePageLayoutLean` was a controlled input (`value={prompt}`, `onChange` calling `setPrompt`). Each character typed:
1. Called `setPrompt` in the parent
2. Re-rendered `MerchGeneratorPlatform` with all its descendants

No expensive `useEffect` in `MerchGeneratorPlatform` had `prompt` in its dependency array, so the damage was purely from the synchronous re-render cascade on every keystroke.

## Fix Applied

### Fix A: Local textarea state in `CreatePageLayoutLean`

**File:** `/components/create/CreatePageLayoutLean.tsx`

- Added `const [localPrompt, setLocalPrompt] = useState(prompt)` — local state that owns the textarea value.
- Added `const localPromptRef = useRef(localPrompt)` — kept in sync each render, used to read the latest value without a stale closure.
- Textarea `value` now uses `localPrompt`; `onChange` calls `setLocalPrompt` only — the parent `MerchGeneratorPlatform` is **not** re-rendered on each keystroke.
- Textarea `onBlur` calls `setPrompt(localPromptRef.current)` to flush the value to the parent when the user leaves the field.
- Added `useEffect(() => { setLocalPrompt(prompt) }, [prompt])` so that external prompt changes (style chips, suggestion clicks, `onUseSuggestedPromptClick`, initial query from URL params) are reflected in the textarea.
- Updated `handleChipPrompt`, `handleReplaceConfirm`, `handleUsePrompt`, and `handleAppendStyle` to update both `localPrompt` and call `setPrompt` so the parent stays in sync for these programmatic writes.
- Generate button `disabled` check now uses `localPrompt` so it responds immediately to user input without waiting for a parent re-render.

### Fix B: Safe generate call

**File:** `/components/create/CreatePageLayoutLean.tsx`

- Updated `onGenerate` prop type from `() => void` to `(promptOverride?: string) => void`.
- Added a `handleGenerate` wrapper that calls `setPrompt(latest)` and then `onGenerate(latest)`, passing the current `localPrompt` value as an explicit override to `MerchGeneratorPlatform`'s `handleGenerate`.
- `MerchGeneratorPlatform.handleGenerate` already accepts a `promptOverride?: unknown` parameter and uses it as `effectivePrompt` — so this works without modifying that file.
- This guarantees the correct prompt is used even if React hasn't committed the `setPrompt` state update before the async generation starts.

### Fix C: No `useEffect` on `prompt` in parent

Confirmed by code audit that no `useEffect` in `MerchGeneratorPlatform` has `prompt` in its dependency array. No debounce fix was needed.

## Expected Improvement

- Keystrokes in the textarea now only re-render `CreatePageLayoutLean` (a single component), not `MerchGeneratorPlatform` and its full tree.
- Input lag on moderate/low-end devices should be eliminated entirely.
- No user-visible behaviour change: chips and suggestions still update the textarea, the generate button enables/disables correctly, and the generation flow uses the correct prompt value.
