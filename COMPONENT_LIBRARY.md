# Verdict Component Library

A comprehensive, accessible, and world-class component library for the Verdict platform.

## 🎯 Design Principles

### 1. **Accessibility First**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### 2. **Mobile-First Design**
- Touch-optimized interactions (44px minimum touch targets)
- Responsive layouts
- Performance-conscious

### 3. **Consistent Brand Identity**
- Indigo-600 primary color system
- 6-level typography hierarchy
- 4px/8px spacing grid
- 200ms animation standard

### 4. **Developer Experience**
- TypeScript support
- Composable components
- Consistent APIs
- Comprehensive documentation

---

## 🧱 Core Components

### **Buttons**

#### Primary Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="default">
  Primary Action
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `destructive`, `link`
**Sizes**: `sm` (36px), `default` (44px), `lg` (48px), `icon`
**Touch Optimized**: All buttons meet 44px minimum touch target

#### Touch Button
```tsx
import { TouchButton } from '@/components/ui/touch-button';

<TouchButton 
  variant="primary" 
  size="lg"
  loading={isSubmitting}
>
  Submit Form
  <ArrowRight className="ml-2 w-4 h-4" />
</TouchButton>
```

**Features**: Loading states, active press feedback, accessibility support

---

### **Typography**

#### Typography Component
```tsx
import { Typography, PageTitle, SectionTitle } from '@/components/ui/typography';

<PageTitle>Main Page Heading</PageTitle>
<SectionTitle>Section Heading</SectionTitle>
<Typography variant="body" color="muted">
  Body text content
</Typography>
```

**Variants**: `display`, `h1`, `h2`, `h3`, `h4`, `body`, `body-large`, `body-small`, `caption`
**Colors**: `default`, `muted`, `primary`, `success`, `warning`, `danger`

---

### **Form Components**

#### Validated Input
```tsx
import { ValidatedInput, validationRules } from '@/components/ui/form-validation';

<ValidatedInput
  label="Email Address"
  type="email"
  required
  validationRules={[
    validationRules.required(),
    validationRules.email()
  ]}
  onValidationChange={(validation) => setEmailValid(validation.isValid)}
/>
```

**Features**: Real-time validation, accessibility labels, error states

#### Validated Textarea
```tsx
import { ValidatedTextarea } from '@/components/ui/form-validation';

<ValidatedTextarea
  label="Your Question"
  maxLength={500}
  showCharCount
  validationRules={[
    validationRules.required("Please enter your question"),
    validationRules.minLength(10, "Question must be at least 10 characters")
  ]}
/>
```

**Features**: Character counting, progressive validation, resize handling

---

### **Loading States**

#### Page Loading
```tsx
import { PageLoading } from '@/components/ui/loading-states';

<PageLoading 
  title="Loading your verdicts..." 
  subtitle="Please wait while we fetch your data" 
/>
```

#### Card Skeleton
```tsx
import { CardSkeleton, CardGridSkeleton } from '@/components/ui/loading-states';

// Single card skeleton
<CardSkeleton />

// Grid of skeletons
<CardGridSkeleton count={6} />
```

#### Loading Overlay
```tsx
import { LoadingOverlay } from '@/components/ui/loading-states';

<LoadingOverlay loading={isSubmitting} message="Submitting your request...">
  <FormContent />
</LoadingOverlay>
```

---

### **Error Handling**

#### Error State Component
```tsx
import { ErrorState, PageError } from '@/components/ui/loading-states';

<ErrorState
  type="network"
  title="Connection Error"
  description="Please check your internet connection"
  action={{
    label: "Try Again",
    onClick: () => refetch()
  }}
/>
```

**Types**: `error`, `network`, `empty`, `unauthorized`

#### Validation Summary
```tsx
import { ValidationSummary } from '@/components/ui/form-validation';

<ValidationSummary 
  validations={{
    email: { isValid: false, message: "Invalid email format", type: "error" },
    password: { isValid: false, message: "Password too short", type: "error" }
  }}
/>
```

---

### **Animations**

#### Fade In Animation
```tsx
import { FadeIn } from '@/components/ui/animations';

<FadeIn delay={200} duration="normal">
  <ContentToAnimate />
</FadeIn>
```

#### Staggered Animations
```tsx
import { StaggeredAnimation } from '@/components/ui/animations';

<StaggeredAnimation staggerDelay={100} animation="fade">
  {items.map(item => <ItemComponent key={item.id} />)}
</StaggeredAnimation>
```

#### Hover Interactions
```tsx
import { HoverLift } from '@/components/ui/animations';

<HoverLift lift="md">
  <Card>Hoverable content</Card>
</HoverLift>
```

---

### **Navigation**

#### Breadcrumb
```tsx
import Breadcrumb from '@/components/Breadcrumb';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'My Verdicts', href: '/my-verdicts' },
    { label: 'Current Request' }
  ]}
/>
```

#### Skip Links
```tsx
import { SkipLink } from '@/lib/accessibility';

<SkipLink href="#main-content">
  Skip to main content
</SkipLink>
```

---

## 🎨 Design Tokens

### **Colors**
```typescript
// Primary Brand Colors
primary-50: #eef2ff
primary-500: #6366f1  // Main brand color
primary-600: #4f46e5  // Primary dark

// Secondary Colors  
secondary-600: #9333ea

// Status Colors
success-600: #16a34a
warning-600: #d97706
danger-600: #dc2626

// Neutrals
gray-50 to gray-900
```

### **Typography Scale**
```typescript
// Display (Hero headlines only)
text-4xl md:text-6xl font-bold

// H1 (Page titles)
text-3xl md:text-4xl font-bold

// H2 (Section headers)
text-2xl md:text-3xl font-semibold

// H3 (Subsection headers)
text-xl md:text-2xl font-semibold

// H4 (Card titles)
text-lg md:text-xl font-medium

// Body
text-base leading-normal
```

### **Spacing System** 
```typescript
// 4px/8px grid
xs: 8px   (p-2)
sm: 12px  (p-3)  
md: 16px  (p-4)
lg: 24px  (p-6)
xl: 32px  (p-8)
2xl: 48px (p-12)
```

---

## 📱 Mobile Patterns

### **Touch Targets**
- Minimum 44px height/width
- Generous padding for thumb navigation
- Clear visual feedback on interaction

### **Navigation Patterns**
```tsx
// Mobile-optimized tab navigation
<div className="flex gap-2 mb-4">
  {tabs.map(tab => (
    <button
      key={tab.key}
      className="px-4 py-2 rounded-lg text-sm font-medium min-h-[44px]"
    >
      {tab.label}
    </button>
  ))}
</div>
```

### **Form Patterns**
```tsx
// Mobile-first form layout
<div className="space-y-4">
  <ValidatedInput
    label="Field Label" 
    className="w-full"
    // Automatically includes proper touch targets
  />
</div>
```

---

## ♿ Accessibility Features

### **Keyboard Navigation**
```tsx
import { useKeyboardNavigation } from '@/lib/accessibility';

const { activeIndex, setItemRef } = useKeyboardNavigation(
  items.length,
  (index) => selectItem(index)
);
```

### **Focus Management**
```tsx
import { useFocusTrap } from '@/lib/accessibility';

const trapRef = useFocusTrap(isModalOpen);

<div ref={trapRef}>
  <ModalContent />
</div>
```

### **Screen Reader Support**
```tsx
import { useAnnouncements, ScreenReaderOnly } from '@/lib/accessibility';

const { announce } = useAnnouncements();

// Announce dynamic changes
announce("Form submitted successfully", "assertive");

// Screen reader only content
<ScreenReaderOnly>
  Additional context for screen readers
</ScreenReaderOnly>
```

---

## 🚀 Performance

### **Code Splitting**
```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

<Suspense fallback={<CardSkeleton />}>
  <HeavyComponent />
</Suspense>
```

### **Image Optimization**
```tsx
// Optimized image component with lazy loading
<Image
  src="/path/to/image.jpg"
  alt="Descriptive text"
  width={300}
  height={200}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 🔧 Usage Guidelines

### **Component Composition**
```tsx
// ✅ Good: Composable, clear hierarchy
<Card>
  <CardContent className="p-6">
    <PageTitle>Request Details</PageTitle>
    <BodyText className="mt-4">
      Your request content here
    </BodyText>
    <div className="mt-6 flex gap-3">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  </CardContent>
</Card>

// ❌ Bad: Inline styles, no hierarchy
<div style={{padding: '24px', border: '1px solid #ccc'}}>
  <h1 style={{fontSize: '24px'}}>Request Details</h1>
  <p>Your request content here</p>
  <button style={{backgroundColor: 'blue'}}>Submit</button>
</div>
```

### **Responsive Design**
```tsx
// ✅ Good: Mobile-first responsive
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {items.map(item => <ItemCard key={item.id} />)}
</div>

// ❌ Bad: Desktop-first, breaks on mobile
<div style={{display: 'flex', flexWrap: 'wrap'}}>
  {items.map(item => <div style={{width: '33%'}} />)}
</div>
```

### **Error Handling**
```tsx
// ✅ Good: Graceful error states
{error ? (
  <ErrorState 
    title="Failed to load"
    action={{ label: "Retry", onClick: refetch }}
  />
) : (
  <DataView data={data} />
)}

// ❌ Bad: No error handling
<DataView data={data} />
```

---

## 📚 Advanced Patterns

### **Smart Defaults**
```tsx
import { SmartDefaults } from '@/lib/smart-defaults';

// Auto-detect category from user input
const defaults = SmartDefaults.generateDefaults(userText, hasImage);
```

### **Progress Saving**
```tsx
import { ProgressManager } from '@/lib/smart-defaults';

// Save form progress automatically
useEffect(() => {
  ProgressManager.saveProgress({
    step,
    mediaType,
    question: formData.question
  });
}, [step, mediaType, formData]);
```

### **Custom Hooks**
```tsx
// Form validation hook
const { validation, isDirty, markDirty } = useValidation(
  value,
  [validationRules.required(), validationRules.minLength(5)]
);

// Animation on scroll
const { ref, isVisible } = animationUtils.useScrollAnimation();
```

---

## 🎭 Animation Standards

### **Duration Standards**
- **Fast**: 150ms (hover states)
- **Normal**: 200ms (default interactions)
- **Slow**: 300ms (complex transitions)
- **Slower**: 500ms (page transitions)

### **Easing Functions**
- **Default**: ease-out (most interactions)
- **Bounce**: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- **Smooth**: cubic-bezier(0.4, 0, 0.2, 1)

### **Reduced Motion**
All animations automatically respect `prefers-reduced-motion: reduce`

---

## ✅ Quality Checklist

Before using any component, ensure:

- [ ] **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- [ ] **Touch Targets**: Minimum 44px for interactive elements
- [ ] **Loading States**: Skeleton screens or spinners
- [ ] **Error States**: Graceful error handling with recovery actions
- [ ] **Responsive**: Works on mobile, tablet, desktop
- [ ] **Performance**: No unnecessary re-renders or heavy computations
- [ ] **Type Safety**: Full TypeScript support
- [ ] **Visual Consistency**: Uses design tokens and brand guidelines

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install class-variance-authority clsx tailwind-merge
   ```

2. **Initialize accessibility**:
   ```tsx
   import { initializeAccessibility } from '@/lib/accessibility';
   
   // Call once in your app root
   useEffect(() => {
     initializeAccessibility();
   }, []);
   ```

3. **Use components**:
   ```tsx
   import { Button } from '@/components/ui/button';
   import { ValidatedInput } from '@/components/ui/form-validation';
   ```

4. **Follow patterns**:
   - Always use semantic HTML
   - Include proper ARIA attributes
   - Test with keyboard navigation
   - Verify screen reader compatibility

This component library provides the foundation for building world-class user experiences that are accessible, performant, and delightful to use.