import React from 'react';
import { ActivityItem } from '../../types';
import { CheckCircle2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';

interface ActivityListProps {
  activities: ActivityItem[];
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  return (
    <Card title="Recent Activity">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activities.map((item) => {
          const getIcon = () => {
            switch (item.status) {
              case 'success':
                return <CheckCircle2 size={16} />;
              case 'warning':
                return <AlertTriangle size={16} />;
              default:
                return <Info size={16} />;
            }
          };

          return (
            <div key={item.id} className="timeline-item">
              <div className={`timeline-icon-wrap ${item.status}`}>{getIcon()}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">{item.title}</span>
                  <span className="timeline-time">{item.relativeTime}</span>
                </div>
                <p className="timeline-desc">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
