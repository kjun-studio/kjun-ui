import { validateKjunDomainCss } from '../../../shared/package-runtime/css-contract';

/** Use the rendered component's scope, including when it lives in a portal. */
export function domainColorMixin(required) {
  function validate() {
    if (required(this) && this.$el?.nodeType === 1) validateKjunDomainCss(this.$el);
  }
  return { mounted: validate, updated: validate };
}

// Functional PriceCell has sibling roots, so it validates its value span directly.
export const domainColorHooks = required => required ? {
  insert: vnode => validateKjunDomainCss(vnode.elm),
  postpatch: (_, vnode) => validateKjunDomainCss(vnode.elm),
} : undefined;
