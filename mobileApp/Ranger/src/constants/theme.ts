export const THEME = {
  colors: {
    // Brand & Conservation Palette
    primary: '#1B4332', // Deep forest green
    primaryDark: '#081C15',
    primaryLight: '#2D6A4F',
    primaryMuted: '#40916C',
    accent: '#52B788',
    accentLight: '#D8F3DC',

    // Outdoor & High-Contrast Neutrals
    background: '#F6F8F6',
    surface: '#FFFFFF',
    surfaceSubtle: '#EDF2EE',
    border: '#D0DDD2',
    borderLight: '#E5EDE7',

    // Text (Readable under direct sunlight)
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',
    textAccent: '#1B4332',

    // Status Colors (Never rely on color alone; always paired with badges)
    status: {
      synced: {
        bg: '#D1FAE5',
        text: '#065F46',
        border: '#10B981',
      },
      pending: {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#F59E0B',
      },
      syncing: {
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#3B82F6',
      },
      failed: {
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#EF4444',
      },
    },

    // Connectivity
    online: '#10B981',
    offline: '#D97706',
    error: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  touchTarget: {
    minHeight: 48,
    minWidth: 48,
  },

  typography: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    heading: 28,
  },
};

export default THEME;
