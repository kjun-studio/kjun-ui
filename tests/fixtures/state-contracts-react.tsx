import { createRoot } from "react-dom/client";
import { forwardRef, useState, type ButtonHTMLAttributes } from "react";
import { KjunProvider, DsModal, DsTable, DsButton, DsDropdown, DsDropdownItem, DsMenuButton, DsTooltip } from "@kjun/react";
import { setRootValues } from "./style-values";
import { TableCase } from "./state-contracts-table";
setRootValues();
const ForwardedButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button {...props} ref={ref} />);
function ModalCase() {
  const [config, setConfig] = useState({ open: true, ariaLabel: "Custom dialog", title: "", showHeader: true, customHeader: false });
  Object.assign(window, { configureState: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <DsModal {...config} onOpenChange={open => setConfig(old => ({ ...old, open }))}
    header={config.customHeader ? <span>Custom heading</span> : undefined}>Dialog body</DsModal>;
}
function MenuCase() {
  const [config, setConfig] = useState({ kind: "button", disabled: false, triggerId: "", tooltip: false });
  const [chosen, setChosen] = useState(0), [clicks, setClicks] = useState(0);
  Object.assign(window, { configureState: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  const items = <DsDropdownItem onClick={() => setChosen(n => n + 1)}>Choose item</DsDropdownItem>;
  const props = { disabled: config.disabled, triggerId: config.triggerId || undefined, menuId: "choices" };
  let trigger = config.kind === "native"
    ? <button id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</button>
    : config.kind === "custom"
    ? <ForwardedButton id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</ForwardedButton>
    : <DsButton id="existing-trigger" onClick={() => setClicks(n => n + 1)}>Open menu</DsButton>;
  if (config.tooltip) trigger = <DsTooltip content="Menu help">{trigger}</DsTooltip>;
  return <>
    {config.kind === "menu-button"
      ? <DsMenuButton {...props} label="Open menu" tooltip={config.tooltip ? "Menu help" : undefined}>{items}</DsMenuButton>
      : <DsDropdown {...props} trigger={trigger}>{items}</DsDropdown>}
    <output data-testid="chosen">{chosen}</output>
    <output data-testid="clicks">{clicks}</output>
  </>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider>
  {location.search.includes("table") ? <TableCase Control={DsTable} detail={id => <span>Detail {id}</span>} />
    : location.search.includes("menu") ? <MenuCase /> : <ModalCase />}
</KjunProvider>);
