import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { THEME } from '../constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  showCharCount = false,
  maxLength,
  value = '',
  multiline = false,
  ...props
}) => {
  const currentLength = (value || '').length;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.required}>*</Text> : null}
        </View>

        {showCharCount && maxLength ? (
          <Text style={styles.charCount}>
            {currentLength}/{maxLength}
          </Text>
        ) : null}
      </View>

      <TextInput
        accessible={true}
        accessibilityLabel={label}
        accessibilityRole="none"
        placeholderTextColor={THEME.colors.textMuted}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : null,
        ]}
        {...props}
      />

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: THEME.typography.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  required: {
    color: THEME.colors.error,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  charCount: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm + 2,
    fontSize: THEME.typography.base,
    color: THEME.colors.textPrimary,
    minHeight: THEME.touchTarget.minHeight,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: THEME.spacing.md,
  },
  inputError: {
    borderColor: THEME.colors.error,
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorIcon: {
    color: THEME.colors.error,
    fontSize: 12,
    marginRight: 4,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: THEME.typography.xs,
    fontWeight: '600',
  },
  helperText: {
    color: THEME.colors.textMuted,
    fontSize: THEME.typography.xs,
    marginTop: 4,
  },
});

export default InputField;
