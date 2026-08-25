import React from 'react';
import { Modal } from '../ui/Modal';
import { VpsWebTerminal } from './VpsWebTerminal';
import { VpsInstance } from '../../types';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vps: VpsInstance;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose, vps }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Web SSH Console • ${vps.hostname}`}
      size="lg"
    >
      <VpsWebTerminal vps={vps} />
    </Modal>
  );
};
