import { domainColorRef } from "../../../../shared/package-runtime/css-contract";

/** Vue function refs also receive component instances; the domain color check takes elements. */
export const domainRef = (required: boolean) => {
  const check = domainColorRef(required);
  return check && ((el: unknown) => check(el instanceof Element ? el : null));
};
