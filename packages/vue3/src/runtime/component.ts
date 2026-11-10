import { defineComponent as vueDefineComponent } from "vue";
import { kjunPropValues } from "../prop-values";

type PropOption = { validator?: (value: unknown, props: Record<string, unknown>) => boolean };
type ComponentOptions = { name?: string; props?: Record<string, PropOption> };
const choices: Readonly<Record<string, Readonly<Record<string, readonly unknown[]>>>> = kjunPropValues;

/** Keep Vue's overloads/inference and component identity; only add development validators. */
export const defineComponent = ((options: ComponentOptions | Function, ...rest: unknown[]) => {
  if (process.env.NODE_ENV !== "production" && typeof options !== "function") {
    const values = choices[options.name ?? ""];
    if (values && options.props) {
      const props = { ...options.props };
      for (const [name, allowed] of Object.entries(values)) {
        const original = props[name];
        if (!original) continue;
        props[name] = { ...original, validator: (value, resolvedProps) =>
          allowed.includes(value) && (!original.validator || original.validator(value, resolvedProps)) };
      }
      options = { ...options, props };
    }
  }
  return (vueDefineComponent as (...args: unknown[]) => unknown)(options, ...rest);
}) as typeof vueDefineComponent;
