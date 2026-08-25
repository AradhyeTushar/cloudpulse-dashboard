import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Smartphone,
  Laptop,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface SessionItem {
  id: string;
  currentLogin: string;
  device: 'mobile' | 'desktop';
  location: string;
  firstLogin: string;
  loginType: string;
}

export const AccountActivitySection: React.FC = () => {
  const { showToast } = useToast();
  const [searchCountry, setSearchCountry] = useState('');
  const [recognizeModalOpen, setRecognizeModalOpen] = useState(false);

  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'sess-1',
      currentLogin: '2026-08-24 02:41:07',
      device: 'mobile',
      location: 'United States (198.51.100.24)',
      firstLogin: '2026-08-24 02:41:07',
      loginType: 'google',
    },
    {
      id: 'sess-2',
      currentLogin: '2026-08-21 21:50:07',
      device: 'mobile',
      location: 'United States (198.51.100.24)',
      firstLogin: '2026-08-21 21:50:07',
      loginType: 'google',
    },
    {
      id: 'sess-3',
      currentLogin: '2026-08-21 21:41:59',
      device: 'desktop',
      location: 'Germany (203.0.113.15)',
      firstLogin: '2026-08-21 21:41:59',
      loginType: 'google',
    },
  ]);

  const filteredSessions = sessions.filter((s) =>
    s.location.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const handleLogoutAllOther = () => {
    setSessions((prev) => prev.slice(0, 1));
    setRecognizeModalOpen(false);
    showToast('Sessions Terminated', 'All other active devices were logged out.', 'success');
  };

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Account activity
      </h1>

      {/* Top Banner Card matching Screenshot 4 */}
      <div className="activity-banner-card">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          You can log out anytime from any device that has been connected to your account
        </p>

        <button
          className="activity-btn-outline"
          onClick={() => setRecognizeModalOpen(true)}
        >
          Don't recognize a device?
        </button>
      </div>

      {/* Activity Table Card matching Screenshot 4 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem 1.5rem 0.5rem' }}>
          <div className="search-input-wrap" style={{ maxWidth: '100%' }}>
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by country"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Current Login</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>Device</th>
                <th>Location</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>First Login</span>
                    <ArrowUpDown size={12} color="var(--text-dim)" />
                  </div>
                </th>
                <th>Login Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No sessions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => (
                  <tr key={sess.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {sess.currentLogin}
                    </td>
                    <td>
                      <span style={{ textTransform: 'lowercase', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {sess.device}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {sess.location}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {sess.firstLogin}
                    </td>
                    <td>
                      <span style={{ textTransform: 'lowercase', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {sess.loginType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Screenshot 4 */}
        <div className="table-pagination-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Page size:</span>
            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.6rem', fontSize: '0.775rem' }}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>1 to {filteredSessions.length} of {filteredSessions.length}</span>
          </div>

          <div className="pagination-controls-group">
            <button className="pagination-arrow-btn" disabled><ChevronsLeft size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Page 1 of 1</span>
            <button className="pagination-arrow-btn" disabled><ChevronRight size={14} /></button>
            <button className="pagination-arrow-btn" disabled><ChevronsRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Security Action Modal */}
      <Modal
        isOpen={recognizeModalOpen}
        onClose={() => setRecognizeModalOpen(false)}
        title="Don't recognize a device?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecognizeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogoutAllOther}>Log Out All Other Devices</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            If you notice any suspicious login activity from an unfamiliar IP address or location, you should revoke all active session tokens immediately and change your account password.
          </p>
          <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#92400e' }}>
            <AlertCircle size={16} />
            <span>This will immediately disconnect all mobile and desktop sessions except this current one.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
