import { useState, useCallback, useMemo } from 'react';
import { validateEmail, validatePassword, validateName, validateRequired } from '@/utils/error-handling';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  email?: boolean;
  password?: boolean;
  name?: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseFormValidationOptions {
  rules: Record<string, ValidationRule>;
  onSubmit?: (data: Record<string, string>) => void | Promise<void>;
  onError?: (errors: ValidationErrors) => void;
}

export function useFormValidation({ rules, onSubmit, onError }: UseFormValidationOptions) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && !value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value.trim() && !rule.required) {
      return null;
    }

    // Email validation
    if (rule.email) {
      return validateEmail(value);
    }

    // Password validation
    if (rule.password) {
      return validatePassword(value);
    }

    // Name validation
    if (rule.name) {
      return validateName(value);
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(name => {
      const error = validateField(name, values[name] || '');
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, values, validateField]);

  const handleChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const error = validateField(name, values[name] || '');
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [values, validateField]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(rules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      if (onError) {
        onError(errors);
      }
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [rules, validateForm, errors, onSubmit, onError]);

  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  const setValue = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const isValid = useMemo(() => {
    return Object.keys(rules).every(name => {
      const error = validateField(name, values[name] || '');
      return !error;
    });
  }, [rules, values, validateField]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error.length > 0);
  }, [errors]);

  const isFieldTouched = useCallback((name: string) => {
    return touched[name] || false;
  }, [touched]);

  const getFieldError = useCallback((name: string) => {
    return errors[name] || '';
  }, [errors]);

  const isFieldValid = useCallback((name: string) => {
    return !errors[name] && (values[name] || '').length > 0;
  }, [errors, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearError,
    isFieldTouched,
    getFieldError,
    isFieldValid,
    validateField,
    validateForm,
  };
}

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    password: true,
  },
  name: {
    required: true,
    name: true,
  },
  confirmPassword: {
    required: true,
    custom: (value: string, allValues?: Record<string, string>) => {
      if (allValues && value !== allValues.password) {
        return 'Passwords do not match';
      }
      return null;
    },
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  url: {
    pattern: /^https?:\/\/.+/,
  },
};
