import selectorParser from "postcss-selector-parser";

// kjun-owned markup, as in packages/tokens/src/reset.css: an element with a kjun- class other than the
// bare Provider root, or a portal root that pairs kjun-scope with a kjun- class.
export const kjunMarkup = ':where([class*="kjun-"]:not(.kjun-scope), .kjun-scope[class*=" kjun-"])';
// Already tied to kjun markup: a kjun- class other than kjun-scope, the boundary itself, or Vue's scope attribute.
const owned = /\[class\*="kjun-"\]|\.kjun-(?!scope\b)|data-v-kjun-/;
// CSS-only helpers that apps put on their own wrappers.
const helpers = new Set([".ds-form-layout"]);

const hasDsClass = compound => compound.some(node => node.type === "class" && node.value.startsWith("ds-"));

// Apps (notably the one kjun was extracted from) use the same ds-* names, so a .ds-* rule must not match
// app markup inside the Provider. Each selector becomes two: the first ds-* compound inside kjun markup,
// or the compound itself being kjun markup. :where() keeps the specificity unchanged.
function scopeSelector(selector) {
  if (!/\.ds-/.test(selector) || owned.test(selector) || helpers.has(selector.trim())) return [selector];
  const variants = [];
  selectorParser(root => {
    const original = root.first;
    const compounds = [[]];
    const combinators = [null];
    for (const node of original.nodes) {
      if (node.type === "combinator") { compounds.push([]); combinators.push(node); }
      else compounds[compounds.length - 1].push(node);
    }
    const index = compounds.findIndex(hasDsClass);
    if (index < 0) { variants.push(selector); return; }
    const marker = () => selectorParser.pseudo({ value: ":where", nodes: selectorParser(r => r).astSync(kjunMarkup.slice(7, -1)).nodes });
    // Self: append the marker before any pseudo-element of the compound.
    const self = original.clone();
    let position = 0;
    for (let i = 0; i < index; i++) position += compounds[i].length + 1;
    const target = compounds[index];
    const pseudoElement = target.findIndex(node => node.type === "pseudo" && node.value.startsWith("::"));
    const insertAt = position + (pseudoElement < 0 ? target.length : pseudoElement);
    self.nodes.splice(insertAt, 0, marker());
    // Inside: only when the compound starts the selector or follows a descendant combinator.
    const combinator = combinators[index];
    if (!combinator || combinator.value === " ") {
      const inside = original.clone();
      inside.nodes.splice(position, 0, marker(), selectorParser.combinator({ value: " " }));
      variants.push(inside.toString().trim());
    }
    variants.push(self.toString().trim());
  }).processSync(selector);
  return variants;
}

export const scopeDsRules = () => ({
  postcssPlugin: "kjun-scope-ds-rules",
  Rule(rule) {
    if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
    if (rule.__kjunDsScoped) return;
    rule.__kjunDsScoped = true;
    const selectors = rule.selectors.flatMap(scopeSelector);
    if (selectors.join() !== rule.selectors.join()) rule.selectors = selectors;
  },
});
scopeDsRules.postcss = true;
