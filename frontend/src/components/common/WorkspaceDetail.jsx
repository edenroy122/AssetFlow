import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from './Button';
import './WorkspaceDetail.css';

const WorkspaceDetail = ({ title, onBack, children, footer }) => (
  <section className="workspace-detail" aria-label={title}>
    <header className="workspace-detail-header">
      <Button className="workspace-detail-back" variant="secondary" icon={ArrowLeft} onClick={onBack}>
        Back to list
      </Button>
      <div className="workspace-detail-heading">
        <span>RECORD DETAILS</span>
        <h1>{title}</h1>
      </div>
    </header>
    <div className="workspace-detail-content">
      <div className="workspace-detail-panel">{children}</div>
    </div>
    {footer && <footer className="workspace-detail-footer">{footer}</footer>}
  </section>
);

export default WorkspaceDetail;
