import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Rocket, Globe, Server, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface QuickActionsProps {
  onCreateVps: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onCreateVps }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Actions</h3>
      </div>
      <div className="quick-actions-grid">
        <div className="quick-action-card" onClick={onCreateVps}>
          <div className="quick-action-icon">
            <PlusCircle size={22} />
          </div>
          <div>
            <div className="quick-action-title">Create VPS</div>
            <div className="quick-action-desc">Provision a new virtual cloud server</div>
          </div>
        </div>

        <div
          className="quick-action-card"
          onClick={() => showToast('Deploy Application', 'Application deployment flow is coming soon.', 'info')}
        >
          <div className="quick-action-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            <Rocket size={22} />
          </div>
          <div>
            <div className="quick-action-title">Deploy Application</div>
            <div className="quick-action-desc">Deploy from Git, Docker, or template</div>
          </div>
        </div>

        <div
          className="quick-action-card"
          onClick={() => showToast('Connect Domain', 'Domain DNS management is coming soon.', 'info')}
        >
          <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            <Globe size={22} />
          </div>
          <div>
            <div className="quick-action-title">Add Domain</div>
            <div className="quick-action-desc">Point DNS or register a new domain</div>
          </div>
        </div>

        <div className="quick-action-card" onClick={() => navigate('/vps')}>
          <div className="quick-action-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' }}>
            <Server size={22} />
          </div>
          <div>
            <div className="quick-action-title">View All VPS</div>
            <div className="quick-action-desc">Manage running instances and specs</div>
          </div>
        </div>
      </div>
    </div>
  );
};
