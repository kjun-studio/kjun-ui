import { ErrorCodes, callWithErrorHandling, getCurrentInstance } from "vue";
import { domainColorRef } from "../../../../shared/package-runtime/css-contract";

/**
 * Vue function refs also receive component instances, and Vue calls them while a new tree is still detached.
 * The domain color check reads computed styles, so it waits until the element is in the document, as React's
 * commit-phase refs do, and reports through Vue's error handling either way.
 */
export const domainRef = (required: boolean) => {
  const check = domainColorRef(required);
  if (!check) return undefined;
  const instance = getCurrentInstance();
  return (el: unknown) => {
    const element = el instanceof Element ? el : null;
    if (!element) return;
    if (element.isConnected) check(element);
    else queueMicrotask(() => { if (element.isConnected) callWithErrorHandling(check, instance, ErrorCodes.FUNCTION_REF, [element]); });
  };
};
