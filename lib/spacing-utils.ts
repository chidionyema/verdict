// Verdict Spacing Utilities - Consistent 4px/8px Grid System

// Container spacing for sections and layouts  
export const containerSpacing = {
  // Outer container padding
  container: 'px-4 sm:px-6 lg:px-8',
  
  // Section vertical spacing
  section: {
    xs: 'py-8',      // 32px top/bottom
    sm: 'py-12',     // 48px top/bottom  
    md: 'py-16',     // 64px top/bottom
    lg: 'py-20',     // 80px top/bottom
    xl: 'py-24',     // 96px top/bottom
  },
  
  // Content max-widths for readability
  content: {
    narrow: 'max-w-2xl mx-auto',    // Forms, narrow content
    default: 'max-w-4xl mx-auto',   // Articles, main content
    wide: 'max-w-7xl mx-auto',      // Full-width sections
  },
} as const;

// Component internal spacing (follows 4px/8px grid)
export const componentSpacing = {
  // Padding inside components
  padding: {
    xs: 'p-2',      // 8px all sides
    sm: 'p-3',      // 12px all sides
    md: 'p-4',      // 16px all sides  
    lg: 'p-6',      // 24px all sides
    xl: 'p-8',      // 32px all sides
    '2xl': 'p-12',  // 48px all sides
  },
  
  // Margins between elements
  margin: {
    xs: 'mb-2',     // 8px bottom
    sm: 'mb-3',     // 12px bottom
    md: 'mb-4',     // 16px bottom
    lg: 'mb-6',     // 24px bottom
    xl: 'mb-8',     // 32px bottom
    '2xl': 'mb-12', // 48px bottom
    '3xl': 'mb-16', // 64px bottom
  },
  
  // Gap spacing for flex/grid layouts
  gap: {
    xs: 'gap-2',    // 8px
    sm: 'gap-3',    // 12px
    md: 'gap-4',    // 16px
    lg: 'gap-6',    // 24px
    xl: 'gap-8',    // 32px
  },
} as const;

// Card and component spacing patterns
export const cardSpacing = {
  // Card internal padding
  content: 'p-6',
  contentSmall: 'p-4',
  contentLarge: 'p-8',
  
  // Card spacing from each other
  stack: 'space-y-4',
  stackLarge: 'space-y-6',
  
  // Grid spacing
  grid: 'gap-4',
  gridLarge: 'gap-6',
} as const;

// Form spacing patterns
export const formSpacing = {
  // Form field spacing
  field: 'mb-4',
  fieldLarge: 'mb-6',
  
  // Form sections
  section: 'mb-8',
  sectionLarge: 'mb-12',
  
  // Button groups
  buttonGroup: 'gap-3',
  buttonGroupLarge: 'gap-4',
  
  // Labels and inputs
  label: 'mb-2',
  help: 'mt-1',
  error: 'mt-1',
} as const;

// Common spacing combinations for different page types
export const pageLayouts = {
  // Landing page sections
  landing: {
    hero: 'pt-20 pb-16',
    section: 'py-16',
    cta: 'py-20',
  },
  
  // Dashboard/app pages  
  app: {
    header: 'py-4',
    main: 'py-6',
    sidebar: 'px-4 py-6',
  },
  
  // Content pages (help, legal, etc)
  content: {
    header: 'py-8',
    main: 'py-12',
    article: 'prose prose-gray max-w-4xl mx-auto px-4',
  },
  
  // Form pages
  form: {
    container: 'py-12',
    card: 'p-8',
    narrow: 'max-w-2xl mx-auto',
  },
} as const;

// Responsive spacing utilities 
export const responsiveSpacing = {
  // Mobile-first responsive padding
  responsive: {
    padding: 'p-4 md:p-6 lg:p-8',
    paddingY: 'py-8 md:py-12 lg:py-16',
    paddingX: 'px-4 md:px-6 lg:px-8',
  },
  
  // Mobile-first responsive margins
  marginY: 'my-4 md:my-6 lg:my-8',
  marginBottom: 'mb-4 md:mb-6 lg:mb-8',
} as const;

// Utility function to build consistent spacing classes
export function buildSpacing(options: {
  container?: keyof typeof containerSpacing.content;
  section?: keyof typeof containerSpacing.section;
  padding?: keyof typeof componentSpacing.padding;
  margin?: keyof typeof componentSpacing.margin;
}) {
  const classes = [''];
  
  if (options.container) {
    classes.push(containerSpacing.content[options.container]);
  }
  
  if (options.section) {
    classes.push(containerSpacing.section[options.section]);
  }
  
  if (options.padding) {
    classes.push(componentSpacing.padding[options.padding]);
  }
  
  if (options.margin) {
    classes.push(componentSpacing.margin[options.margin]);
  }
  
  return classes.filter(Boolean).join(' ');
}

// Pre-built common layouts
export const commonLayouts = {
  // Standard page wrapper
  page: `${containerSpacing.container} ${containerSpacing.content.default}`,
  
  // Card with standard spacing
  card: `bg-white rounded-xl shadow-sm border ${cardSpacing.content}`,
  
  // Form container
  form: `${containerSpacing.content.narrow} ${pageLayouts.form.container}`,
  
  // Section with standard spacing
  section: `${containerSpacing.container} ${containerSpacing.section.md}`,
  
  // Grid layouts
  cardGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${cardSpacing.grid}`,
  twoColumnGrid: `grid grid-cols-1 lg:grid-cols-2 ${cardSpacing.gridLarge}`,
} as const;