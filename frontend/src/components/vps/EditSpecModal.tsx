import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface EditSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fieldLabel: string;
  initialValue: string;
  onSave: (val: string) => void;
}

export const EditSpecModal: React.FC<EditSpecModalProps> = ({
  isOpen,
  onClose,
  title,
  fieldLabel,
  initialValue,
  onSave,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{fieldLabel}</label>
          <input
            type="text"
            className="form-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
};
