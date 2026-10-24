import { computed, inject, provide, shallowRef, type Ref } from "vue";
import { defaultMessageScope, resolveMessageScope, type KjunMessages, type KjunMessageScope } from "../../../../shared/package-runtime/messages";
import { kjunMessagesKey } from "./keys";

const scope = () => inject(kjunMessagesKey, shallowRef(defaultMessageScope));

export function provideKjunMessages(locale: () => string | undefined, messages: () => Partial<KjunMessages> | undefined) {
  const parent = scope();
  provide(kjunMessagesKey, computed(() => resolveMessageScope(parent.value, locale(), messages())));
}
export const useKjunMessageScope = (): Readonly<Ref<KjunMessageScope>> => scope();
export function useKjunMessages(): Readonly<Ref<KjunMessages>> {
  const current = scope();
  return computed(() => current.value.messages);
}
