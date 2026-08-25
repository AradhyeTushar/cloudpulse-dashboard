import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

interface NotifMatrixRow {
  id: string;
  title: string;
  description: string;
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  emailDisabled?: boolean;
}

export const NotificationSettingsSection: React.FC = () => {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<NotifMatrixRow[]>([
    {
      id: 'billing',
      title: 'Subscriptions and payments',
      description: 'Stay informed about the status, any changes, and expiration of subscriptions. Get billing and payment updates.',
      sms: true,
      whatsapp: true,
      email: true,
      emailDisabled: true,
    },
    {
      id: 'security',
      title: 'Account and its security',
      description: 'Get notified about changes, issues, or important updates related to your account.',
      sms: true,
      whatsapp: true,
      email: true,
      emailDisabled: true,
    },
    {
      id: 'service',
      title: 'Service status and changes',
      description: 'Get alerts about the status, downtime, and other important information that affects how your services work.',
      sms: true,
      whatsapp: true,
      email: true,
      emailDisabled: true,
    },
    {
      id: 'marketing',
      title: 'Product updates and special offers',
      description: 'Be the first to discover about new products, updates to existing ones, and get discounts.',
      sms: false,
      whatsapp: false,
      email: true,
      emailDisabled: false,
    },
  ]);

  const handleToggle = (rowId: string, channel: 'sms' | 'whatsapp' | 'email') => {
    setSettings((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          if (channel === 'email' && row.emailDisabled) return row;
          return {
            ...row,
            [channel]: !row[channel],
          };
        }
        return row;
      })
    );
    showToast('Preference Saved', 'Your communication channel preferences were updated.', 'success');
  };

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        Notification settings
      </h1>

      {/* Subtitle / Consent Notice matching Screenshot 5 */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem', maxWidth: '900px' }}>
        By turning on communication permissions, you agree to let us use your phone number and/or email, as outlined in our <strong style={{ color: 'var(--brand-primary-text)' }}>Privacy Policy</strong>. Content sent via email and other channels may differ. You can withdraw consent anytime.
      </p>

      {/* Notification Matrix Card matching Screenshot 5 */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="notifications-matrix-table">
            <thead>
              <tr>
                <th></th>
                <th>SMS</th>
                <th>WhatsApp</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="notif-category-title">{item.title}</div>
                    <div className="notif-category-desc">{item.description}</div>
                  </td>

                  {/* SMS Checkbox */}
                  <td className="notif-checkbox-cell">
                    <input
                      type="checkbox"
                      className="custom-notif-checkbox"
                      checked={item.sms}
                      onChange={() => handleToggle(item.id, 'sms')}
                      aria-label={`${item.title} SMS notifications`}
                    />
                  </td>

                  {/* WhatsApp Checkbox */}
                  <td className="notif-checkbox-cell">
                    <input
                      type="checkbox"
                      className="custom-notif-checkbox"
                      checked={item.whatsapp}
                      onChange={() => handleToggle(item.id, 'whatsapp')}
                      aria-label={`${item.title} WhatsApp notifications`}
                    />
                  </td>

                  {/* Email Checkbox */}
                  <td className="notif-checkbox-cell">
                    <input
                      type="checkbox"
                      className="custom-notif-checkbox"
                      checked={item.email}
                      disabled={item.emailDisabled}
                      onChange={() => handleToggle(item.id, 'email')}
                      aria-label={`${item.title} Email notifications`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
