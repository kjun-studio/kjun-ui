import { computed, inject, provide, shallowRef, type Ref } from "vue";
import { defaultMessageScope, resolveMessageScope, type KjunMessages, type KjunMessageScope } from "../../../../shared/package-runtime/messages";
import { kjunMessagesKey } from "./keys";
import { stableValue } from "../../../../shared/package-runtime/stable-value";

const scope = () => inject(kjunMessagesKey, shallowRef(defaultMessageScope));

export function provideKjunMessages(locale: () => string | undefined, messages: () => Partial<KjunMessages> | undefined) {
  const parent = scope(), stable = stableValue<Partial<KjunMessages> | undefined>();
  // Like React: inline messages with the same contents keep one scope.
  let last: { inputs: unknown[]; scope: KjunMessageScope } | undefined;
  provide(kjunMessagesKey, computed(() => {
    const inputs = [parent.value, locale(), stable(messages())];
    if (!last || inputs.some((input, i) => input !== last!.inputs[i]))
      last = { inputs, scope: resolveMessageScope(inputs[0] as KjunMessageScope, inputs[1] as string | undefined, inputs[2] as Partial<KjunMessages> | undefined) };
    return last.scope;
  }));
}
export const useKjunMessageScope = (): Readonly<Ref<KjunMessageScope>> => scope();
export function useKjunMessages(): Readonly<Ref<KjunMessages>> {
  const current = scope();
  return computed(() => current.value.messages);
}
