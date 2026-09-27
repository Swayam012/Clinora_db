// ============================================
// Clinora Data Types & Defaults
// ============================================

export const currentUser = {
  id: '',
  full_name: 'Dr. Clinora User',
  email: 'user@clinora.com',
  role: 'admin',
  avatar: null,
};

export const dashboardStats = [
  {
    label: 'Total Patients',
    value: '0',
    trend: '+0%',
    trendUp: true,
    color: 'purple',
  },
  {
    label: 'Documents Processed',
    value: '0',
    trend: '0%',
    trendUp: false,
    color: 'blue',
  },
  {
    label: 'Pending Documents',
    value: '0',
    trend: null,
    trendUp: null,
    color: 'amber',
  },
  {
    label: 'AI Queries',
    value: '0',
    trend: '+0%',
    trendUp: true,
    color: 'mint',
  },
];

export const mockPatients = [];

export const recentDocuments = [];
