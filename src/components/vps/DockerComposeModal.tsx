import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface DockerComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (app: { name: string; image: string; ports: string; status: 'Running' | 'Stopped' }) => void;
  mode?: 'manual' | 'git' | 'template';
}

export const DockerComposeModal: React.FC<DockerComposeModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  mode = 'manual',
}) => {
  const { showToast } = useToast();
  const [appName, setAppName] = useState('');
  const [composeYaml, setComposeYaml] = useState(`services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    restart: always`);
  const [gitUrl, setGitUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('n8n');
  const [loading, setLoading] = useState(false);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const finalName = appName || (mode === 'template' ? selectedTemplate : 'web-app');
      const finalImage = mode === 'template' ? `${selectedTemplate}:latest` : 'nginx:alpine';

      onDeploy({
        name: finalName,
        image: finalImage,
        ports: '8080:80',
        status: 'Running',
      });

      showToast('Deployment Succeeded', `Container ${finalName} started.`, 'success');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'manual'
          ? 'Compose Docker Application'
          : mode === 'git'
          ? 'Deploy from Git Repository'
          : 'Deploy from Template'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDeploy} loading={loading}>
            Deploy Container
          </Button>
        </>
      }
    >
      <form onSubmit={handleDeploy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Application Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. my-awesome-app"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </div>

        {mode === 'manual' && (
          <div className="form-group">
            <label className="form-label">Docker Compose YAML</label>
            <textarea
              className="form-input"
              rows={8}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              value={composeYaml}
              onChange={(e) => setComposeYaml(e.target.value)}
            />
          </div>
        )}

        {mode === 'git' && (
          <div className="form-group">
            <label className="form-label">Git Repository URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://github.com/username/repository.git"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
            />
          </div>
        )}

        {mode === 'template' && (
          <div className="form-group">
            <label className="form-label">Select App Template</label>
            <select
              className="form-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="n8n">n8n - Workflow Automation Platform</option>
              <option value="redis">Redis - In-memory Data Store</option>
              <option value="postgres">PostgreSQL 16 Database</option>
              <option value="wordpress">WordPress + MySQL Stack</option>
              <option value="pocketbase">PocketBase - Backend in 1 file</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
};
