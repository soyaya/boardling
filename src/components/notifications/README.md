# Notification and Error Handling Components

This directory contains all components related to error handling, validation, and user notifications.

## Components

### Toast Notifications

**Toast** - Individual toast notification component
**ToastContainer** - Container for managing multiple toasts
**useToast** - Hook for programmatic toast management
**ToastContext** - Global toast context provider

#### Usage Example:

```tsx
import { useToastContext } from '../contexts/ToastContext';

function MyComponent() {
  const toast = useToastContext();
  
  const handleSuccess = () => {
    toast.success('Operation completed', 'Your changes have been saved successfully.');
  };
  
  const handleError = () => {
    toast.error('Operation failed', 'Unable to save your changes. Please try again.');
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### Alert Components

**ErrorAlert** - Prominent error message display with actions
**SuccessAlert** - Success confirmation display
**NetworkError** - Specialized network error component

#### Usage Example:

```tsx
import { ErrorAlert, SuccessAlert } from '../components/notifications';

function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  return (
    <div>
      {error && (
        <ErrorAlert
          title="Error"
          message={error}
          onDismiss={() => setError(null)}
          onRetry={handleRetry}
        />
      )}
      
      {success && (
        <SuccessAlert
          title="Success"
          message="Your changes have been saved."
          onDismiss={() => setSuccess(false)}
        />
      )}
    </div>
  );
}
```

### Form Components

**FormInput** - Input component with built-in validation error display
**ValidationError** - Inline validation error message

#### Usage Example:

```tsx
import { FormInput } from '../components/notifications';
import { Mail, Lock } from 'lucide-react';

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  return (
    <form>
      <FormInput
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        icon={Mail}
        required
      />
      
      <FormInput
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        icon={Lock}
        helperText="Must be at least 8 characters"
        required
      />
    </form>
  );
}
```

## Error Handling Utilities

The `src/utils/errorHandling.ts` file provides utilities for consistent error handling:

```tsx
import { getErrorMessage, isNetworkError, getValidationErrors } from '../utils/errorHandling';
import { useToastContext } from '../contexts/ToastContext';

function MyComponent() {
  const toast = useToastContext();
  
  const handleApiCall = async () => {
    try {
      await api.someEndpoint();
      toast.success('Success', 'Operation completed successfully');
    } catch (error) {
      // Check for network errors
      if (isNetworkError(error)) {
        toast.error('Network Error', 'Please check your internet connection');
        return;
      }
      
      // Get validation errors
      const validationErrors = getValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }
      
      // Show generic error
      toast.error('Error', getErrorMessage(error));
    }
  };
}
```

## Best Practices

1. **Use toasts for transient notifications** - Success confirmations, brief errors
2. **Use alerts for persistent messages** - Important errors that need user attention
3. **Use validation errors inline** - Field-specific validation feedback
4. **Provide retry actions** - For network errors and recoverable failures
5. **Be specific with error messages** - Help users understand what went wrong
6. **Don't overwhelm users** - Limit the number of simultaneous notifications

## Accessibility

All components follow accessibility best practices:
- Proper ARIA attributes (`role="alert"`, `aria-live`, `aria-invalid`)
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Color contrast compliance
