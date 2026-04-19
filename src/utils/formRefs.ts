import { useRef, useCallback } from 'react';
import type { TextInput } from 'react-native';

/**
 * v1.2.5-dev: Helper for multi-field form keyboard flow.
 *
 * Typical usage:
 *
 *     const { register, focusNext, submit } = useFormRefs(3); // 3 fields
 *
 *     <Input ref={register(0)} returnKeyType="next"
 *            onSubmitEditing={() => focusNext(0)} blurOnSubmit={false}
 *            autoFocus />
 *     <Input ref={register(1)} returnKeyType="next"
 *            onSubmitEditing={() => focusNext(1)} blurOnSubmit={false} />
 *     <Input ref={register(2)} returnKeyType="done"
 *            onSubmitEditing={() => submit(handleSubmit)} />
 *
 * NOTE: the `Input` component uses `React.memo`, so passing a fresh callback
 * ref per render wouldn't break memoization (the ref itself is stable from
 * `register(index)` because we return the same ref callback each time via
 * `useCallback`).
 *
 * Rules (enforced by convention, not by this helper):
 *  - First field should have `autoFocus` on mount.
 *  - All fields except the last pass `blurOnSubmit={false}`.
 *  - The last field's `onSubmitEditing` triggers the primary submit handler.
 */
export function useFormRefs(count: number) {
  // Fixed-size array of nullable TextInput refs. We never mutate the length.
  const refs = useRef<(TextInput | null)[]>(Array(count).fill(null));

  const register = useCallback(
    (index: number) => (el: TextInput | null) => {
      refs.current[index] = el;
    },
    [],
  );

  const focusNext = useCallback((index: number) => {
    const next = refs.current[index + 1];
    if (next && typeof next.focus === 'function') next.focus();
  }, []);

  const focusAt = useCallback((index: number) => {
    const target = refs.current[index];
    if (target && typeof target.focus === 'function') target.focus();
  }, []);

  const submit = useCallback((handler: () => void) => {
    handler();
  }, []);

  return { register, focusNext, focusAt, submit };
}
