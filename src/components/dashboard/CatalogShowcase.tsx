import React, { useState } from 'react';
import { Gamepad2, Workflow, Boxes, ArrowUpRight } from 'lucide-react';
import { MOCK_CATALOG_ITEMS } from '../../data/mock-vps';
import { CatalogItem } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

export const CatalogShowcase: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const { showToast } = useToast();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 size={20} />;
      case 'Workflow':
        return <Workflow size={20} />;
      case 'Boxes':
      default:
        return <Boxes size={20} />;
    }
  };

  const handleAction = (item: CatalogItem) => {
    setSelectedItem(item);
  };

  return (
    <>
      <div className="catalog-divider">
        <span className="catalog-divider-label">Add More</span>
      </div>

      <div className="catalog-grid">
        {MOCK_CATALOG_ITEMS.map((item) => (
          <div key={item.id} className="catalog-card">
            <div>
              <div className="catalog-card-icon-box">{getIcon(item.icon)}</div>
              <h3 className="catalog-card-title">{item.title}</h3>
              <p className="catalog-card-desc">{item.description}</p>
            </div>
            <div className="catalog-card-footer">
              <Button
                variant="secondary"
                size="sm"
                className="btn-pill"
                onClick={() => handleAction(item)}
              >
                {item.actionText}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Catalog Setup / Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Setup ${selectedItem.title}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  showToast(`${selectedItem.title} Template`, 'Deployment configuration initiated (mock).', 'success');
                  setSelectedItem(null);
                }}
              >
                Continue Setup
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="catalog-card-icon-box" style={{ margin: 0 }}>
                {getIcon(selectedItem.icon)}
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedItem.title}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Ready to deploy in seconds on any KVM VPS instance.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <strong>Included features:</strong>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                <li>Pre-configured Docker Compose environment</li>
                <li>Automated SSL certificates via Let's Encrypt</li>
                <li>Zero-maintenance background security patches</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
