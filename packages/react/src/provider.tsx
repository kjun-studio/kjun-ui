import { IconProvider } from "../../../shared/package-runtime/icon-context";
import { KjunMessagesProvider } from "../../../shared/package-runtime/messages-context";
import { normalizeLocale, type KjunMessages } from "../../../shared/package-runtime/messages";
import { I18nProvider } from "react-aria-components";
import type { KjunIconRegistry } from "@kjun-ui/icons";
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
  /** BCP 47 tag (e.g. "en-US") for KJUN copy and Intl formats; without it KJUN stays Korean. */
  locale?: string;
  /** Replaces part of KJUN's copy, e.g. with the app's own translations. */
  messages?: Partial<KjunMessages>;
}
export function KjunProvider({
  icons,
  locale,
  messages,
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
  // react-aria follows the app's language only when one is given; otherwise it keeps its own default as before.
  const intl = normalizeLocale(locale).intl;
  const content = <>{children}{parentPortal === undefined && <div ref={setPortal} data-kjun-layer-host="" />}</>;
  return (
    <div {...props} ref={setContainer} className={"kjun-scope " + className}>
      <KjunMessagesProvider locale={locale} messages={messages}><IconProvider icons={icons}><PortalContext.Provider value={portal}>
        <LayerProvider>{intl ? <I18nProvider locale={intl}>{content}</I18nProvider> : content}</LayerProvider>
      </PortalContext.Provider></IconProvider></KjunMessagesProvider>
    </div>
  );
}
