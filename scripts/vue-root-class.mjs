// Marks each Vue component's root element so the scoped reset reaches only kjun-owned markup.
export const rootClassModule = {
  preTransformNode(el) {
    if (el.parent) return;
    const current = el.attrsMap.class;
    const value = current ? current + ' kjun-root' : 'kjun-root';
    el.attrsMap.class = value;
    const attr = el.attrsList.find(item => item.name === 'class');
    if (attr) attr.value = value;
    else el.attrsList.push({ name: 'class', value });
  },
};
