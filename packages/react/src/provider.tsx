import { IconProvider } from "../../../shared/package-runtime/icon-context";
import type { KjunIconRegistry } from "@kjun/icons";
import { LayerProvider } from "../../../shared/package-runtime/use-layer";
import { createPortalScope } from "../../../shared/package-runtime/portal-scope";
import { validateKjunCssScope } from "../../../shared/package-runtime/css-contract";
import {
createContext,
useContext,
useEffect,
useLayoutEffect,
useState,
type HTMLAttributes,
type ReactNode,
} from "react";
// undefined uses document.body; null waits for a mounting scope.
const PortalContext = createContext<HTMLElement | null | undefined>(undefined);
export const useKjunPortalContainer = () => useContext(PortalContext);
export interface KjunProviderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  icons?: KjunIconRegistry;
}
export function KjunProvider({
  icons,
  children,
  className = "",
  ...props
}: KjunProviderProps) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const parentPortal = useKjunPortalContainer();
  useLayoutEffect(() => {
    if (!container || !parentPortal) return;
    const scope = createPortalScope(container, parentPortal);
    // Let React Aria traverse this otherwise empty host when a later overlay opens.
    // Only the empty marker is exempt; overlay siblings still receive normal isolation.
    const marker = container.ownerDocument.createElement('span');
    marker.hidden = true;
    marker.setAttribute('data-react-aria-top-layer', '');
    scope.element.appendChild(marker);
    setPortal(scope.element);
    return () => { setPortal(null); scope.destroy(); };
  }, [container, parentPortal]);
  useEffect(() => {
    if (!container) return;
    validateKjunCssScope(container);
  });
  return (
    <div {...props} ref={setContainer} className={"kjun-scope " + className}>
      <IconProvider icons={icons}><PortalContext.Provider value={portal}>
        <LayerProvider>{children}{parentPortal === undefined && <div ref={setPortal} data-kjun-layer-host="" />}</LayerProvider>
      </PortalContext.Provider></IconProvider>
    </div>
  );
}
