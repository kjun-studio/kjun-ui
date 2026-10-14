import { createRoot } from "react-dom/client";
import { forwardRef, useState, type ButtonHTMLAttributes } from "react";
import { KjunProvider, KjunModal, KjunTable, KjunButton, KjunDropdown, KjunDropdownItem, KjunMenuButton, KjunTooltip } from "@kjun-ui/react";
import { setRootValues } from "./style-values";
import { TableCase } from "./state-contracts-table";
setRootValues();
const ForwardedButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} />);
function ModalCase() {
  const [config, setConfig] = useState({ open: true, ariaLabel: "Custom dialog", title: "", showHeader: true, customHeader: false });
  Object.assign(window, { configureState: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <KjunModal {...config} onOpenChange={open => setConfig(old => ({ ...old, open }))}
    header={config.customHeader ? <span>Custom heading</span> : undefined}>Dialog body</KjunModal>;
}
function MenuCase() {
  const [config, setConfig] = useState({ kind: "button", disabled: false, triggerId: "", tooltip: false });
  const [chosen, setChosen] = useState(0), [clicks, setClicks] = useState(0);
  Object.assign(window, { configureState: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  const items = <KjunDropdownItem onClick={() => setChosen(n => n + 1)}>Choose item</KjunDropdownItem>;
  const props = { disabled: config.disabled, triggerId: config.triggerId || undefined, menuId: "choices" };
  let trigger = config.kind === "native"
    ? <button id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</button>
    : config.kind === "custom"
    ? <ForwardedButton id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</ForwardedButton>
    : <KjunButton id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</KjunButton>;
  if (config.tooltip) trigger = <KjunTooltip content="Menu help">{trigger}</KjunTooltip>;
  return <>
    {config.kind === "menu-button"
      ? <KjunMenuButton {...props} label="Open menu" tooltip={config.tooltip ? "Menu help" : undefined}>{items}</KjunMenuButton>
      : <KjunDropdown {...props} trigger={trigger}>{items}</KjunDropdown>}
    <output data-testid="chosen">{chosen}</output>
    <output data-testid="clicks">{clicks}</output>
  </>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider>
  {location.search.includes("table") ? <TableCase Control={KjunTable} detail={id => <span>Detail {id}</span>} />
    : location.search.includes("menu") ? <MenuCase /> : <ModalCase />}
</KjunProvider>);
