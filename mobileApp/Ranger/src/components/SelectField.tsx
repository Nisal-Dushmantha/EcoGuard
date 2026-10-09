import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { IncidentType, INCIDENT_TYPES, INCIDENT_TYPE_METADATA } from '../constants/incidentTypes';
import { THEME } from '../constants/theme';

interface SelectFieldProps {
  label: string;
  value: IncidentType | '';
  onChange: (value: IncidentType) => void;
  required?: boolean;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedMeta = value ? INCIDENT_TYPE_METADATA[value] : null;

  const handleSelect = (item: IncidentType) => {
    onChange(item);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.required}>*</Text> : null}
      </View>

      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? value : 'Not selected. Tap to choose'}`}
        activeOpacity={0.8}
        style={[
          styles.selector,
          error ? styles.selectorError : null,
          value ? styles.selectorActive : null,
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedMeta ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedIcon}>{selectedMeta.icon}</Text>
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedTitle}>{selectedMeta.label}</Text>
              <Text style={styles.selectedSub}>{selectedMeta.description}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select incident category...</Text>
        )}
        <Text style={styles.caret}>▼</Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Modal Selection List */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Incident Type</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={INCIDENT_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const meta = INCIDENT_TYPE_METADATA[item];
                const isSelected = item === value;

                let severityBg = '#FEF3C7';
                let severityColor = '#92400E';
                if (meta.severity === 'CRITICAL') {
                  severityBg = '#FEE2E2';
                  severityColor = '#991B1B';
                } else if (meta.severity === 'LOW') {
                  severityBg = '#ECFDF5';
                  severityColor = '#065F46';
                }

                return (
                  <TouchableOpacity
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemIcon}>{meta.icon}</Text>
                    <View style={styles.itemTextContainer}>
                      <View style={styles.itemTopRow}>
                        <Text style={styles.itemTitle}>{meta.label}</Text>
                        <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
                          <Text style={[styles.severityText, { color: severityColor }]}>
                            {meta.severity}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemDescription}>{meta.description}</Text>
                    </View>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  selector: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: THEME.touchTarget.minHeight,
  },
  selectorActive: {
    borderColor: THEME.colors.primary,
  },
  selectorError: {
    borderColor: THEME.colors.error,
    backgroundColor: '#FEF2F2',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  selectedIcon: {
    fontSize: 24,
    marginRight: THEME.spacing.sm,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  selectedSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  placeholder: {
    fontSize: THEME.typography.base,
    color: THEME.colors.textMuted,
  },
  caret: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    padding: THEME.spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.base,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  modalTitle: {
    fontSize: THEME.typography.lg,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  closeButton: {
    fontSize: 20,
    color: THEME.colors.textSecondary,
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  itemCardSelected: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: THEME.spacing.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.xs,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemDescription: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  checkmark: {
    fontSize: 18,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SelectField;
