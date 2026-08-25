import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 190;
    const padding = 8;

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    let top = rect.bottom + 6;
    // Check if dropdown fits vertically
    const estimatedHeight = items.length * 40 + 20;
    if (top + estimatedHeight > window.innerHeight - padding && rect.top - estimatedHeight > padding) {
      top = rect.top - estimatedHeight - 6;
    }

    setCoords({ top, left });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuContent = isOpen ? (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: '190px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 99999,
        padding: '0.4rem',
        animation: 'fadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.divider && (
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />
          )}
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.55rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              color: item.danger ? 'var(--status-error)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = item.danger
                ? 'var(--status-error-bg)'
                : 'var(--bg-surface-hover)';
              e.currentTarget.style.color = item.danger
                ? 'var(--status-error)'
                : 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = item.danger
                ? 'var(--status-error)'
                : 'var(--text-secondary)';
            }}
            onClick={() => {
              item.onClick();
              setIsOpen(false);
            }}
          >
            {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'inline-block' }} ref={triggerRef}>
      <div onClick={handleToggle} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {typeof document !== 'undefined' && menuContent ? ReactDOM.createPortal(menuContent, document.body) : null}
    </div>
  );
};
