import { CreateIncidentFormValues } from '../types/incident';
import { INCIDENT_TYPES } from '../constants/incidentTypes';

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateIncidentForm = (values: CreateIncidentFormValues): FormValidationResult => {
  const errors: Record<string, string> = {};

  // 1. Incident Type Validation
  if (!values.incidentType) {
    errors.incidentType = 'Please select an incident type.';
  } else if (!INCIDENT_TYPES.includes(values.incidentType as any)) {
    errors.incidentType = 'Invalid incident type selected.';
  }

  // 2. GPS Location Validation
  if (!values.location) {
    errors.location = 'Current GPS location is required. Please capture your coordinates.';
  } else {
    const { latitude, longitude } = values.location;
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      errors.location = 'GPS coordinates are invalid.';
    } else if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      errors.location = 'GPS coordinates are out of valid range.';
    }
  }

  // 3. Description Validation
  if (!values.description || values.description.trim().length === 0) {
    errors.description = 'Incident description is required.';
  } else if (values.description.trim().length < 5) {
    errors.description = 'Description must be at least 5 characters long.';
  } else if (values.description.trim().length > 1500) {
    errors.description = 'Description cannot exceed 1500 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRangerLogin = (identifier: string, password: string): FormValidationResult => {
  const errors: Record<string, string> = {};

  if (!identifier || identifier.trim().length === 0) {
    errors.identifier = 'Please enter your Ranger ID or Email.';
  }

  if (!password || password.length === 0) {
    errors.password = 'Please enter your password.';
  } else if (password.length < 4) {
    errors.password = 'Password must be at least 4 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
