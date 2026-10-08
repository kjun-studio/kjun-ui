import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, View } from 'react-native';
import type { ModalWindowProps } from './modal-window';

/** Reorder RN Web's window shell without remounting the retained React subtree. */
export function ModalWindow({ generation, children, visible, ...props }: ModalWindowProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = document.createElement('div');
    element.style.display = 'contents';
    setContainer(element);
    return () => element.remove();
  }, []);
  return <>
    <Modal key={generation} {...props} visible={visible}>
      <View style={{ flex: 1 }} ref={node => {
        if (node && container && container.parentNode !== (node as unknown as HTMLElement))
          (node as unknown as HTMLElement).appendChild(container);
      }} />
    </Modal>
    {visible && container && createPortal(children, container)}
  </>;
}
