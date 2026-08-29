export default function StatusBadge({ status }) {
  const config = {
    processed: { label: 'Processed', className: 'badge-mint' },
    pending: { label: 'Pending', className: 'badge-amber' },
    failed: { label: 'Failed', className: 'badge-red' },
    'ai processed': { label: 'AI Processed', className: 'badge-purple' },
  };

  const { label, className } = config[status?.toLowerCase()] || config.pending;

  return <span className={`status-badge ${className}`}>{label}</span>;
}
