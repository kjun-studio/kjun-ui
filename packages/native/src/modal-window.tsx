import { Modal, type ModalProps } from 'react-native';

export interface ModalWindowProps extends ModalProps { generation: number }

export function ModalWindow({ generation, ...props }: ModalWindowProps) {
  return <Modal key={generation} {...props} />;
}
