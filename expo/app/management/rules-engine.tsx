import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit3, X, Save } from 'lucide-react-native';
import { VenueRule } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function RulesEngineScreen() {
  const [rules, setRules] = useState<VenueRule[]>([]);
  const [editingRule, setEditingRule] = useState<VenueRule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for editing/creating
  const [editThreshold, setEditThreshold] = useState('');
  const [editTimeWindow, setEditTimeWindow] = useState('');
  const [editServerAccess, setEditServerAccess] = useState('PUBLIC_LOBBY');
  const [editBadgeType, setEditBadgeType] = useState('GUEST');
  const [editRuleType, setEditRuleType] = useState<VenueRule['type']>('SPENDING_TIER');
  const [editCondition, setEditCondition] = useState('');
  const [editNotifyManager, setEditNotifyManager] = useState(false);

  const toggleRule = (ruleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Reset form to defaults
    setEditThreshold('100');
    setEditTimeWindow('');
    setEditServerAccess('PUBLIC_LOBBY');
    setEditBadgeType('GUEST');
    setEditRuleType('SPENDING_TIER');
    setEditCondition('Spend $100 or more');
    setEditNotifyManager(false);
    setShowCreateModal(true);
  };

  const handleEdit = (rule: VenueRule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingRule(rule);
    setEditThreshold(rule.trigger.threshold.toString());
    setEditTimeWindow(rule.trigger.timeWindow?.toString() || '');
    setEditServerAccess(rule.reward.serverAccess);
    setEditBadgeType(rule.reward.badgeType || '');
    setEditCondition(rule.trigger.condition);
    setEditNotifyManager(rule.reward.notifyManager || false);
    setShowEditModal(true);
  };

  const handleSaveCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newRule: VenueRule = {
      id: `rule-${Date.now()}`,
      type: editRuleType,
      trigger: {
        condition: editCondition || `Threshold: ${editThreshold}`,
        threshold: parseInt(editThreshold) || 100,
        timeWindow: editTimeWindow ? parseInt(editTimeWindow) : undefined,
      },
      reward: {
        serverAccess: editServerAccess,
        badgeType: editBadgeType,
        notifyManager: editNotifyManager,
      },
      isActive: true,
    };

    setRules(prev => [newRule, ...prev]);
    setShowCreateModal(false);
    Alert.alert('Rule Created', 'Your new automation rule has been created and activated.', [{ text: 'OK' }]);
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedRule: VenueRule = {
      ...editingRule,
      trigger: {
        ...editingRule.trigger,
        condition: editCondition,
        threshold: parseInt(editThreshold) || editingRule.trigger.threshold,
        timeWindow: editTimeWindow ? parseInt(editTimeWindow) : editingRule.trigger.timeWindow,
      },
      reward: {
        ...editingRule.reward,
        serverAccess: editServerAccess,
        badgeType: editBadgeType || editingRule.reward.badgeType,
        notifyManager: editNotifyManager,
      },
    };

    setRules(prev => prev.map(rule => rule.id === editingRule.id ? updatedRule : rule));
    setShowEditModal(false);
    setEditingRule(null);
  };

  const handleDelete = (rule: VenueRule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Rule',
      `Are you sure you want to delete this ${rule.type.replace(/_/g, ' ').toLowerCase()} rule? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRules(prev => prev.filter(r => r.id !== rule.id));
          },
        },
      ]
    );
  };

  const getRuleColor = (type: VenueRule['type']) => {
    switch (type) {
      case 'SPENDING_TIER':
        return '#a855f7';
      case 'FREQUENCY_TIER':
        return '#00d4ff';
      case 'SPECIFIC_PURCHASE':
        return '#ff6b9d';
      case 'PERFORMER_LOYALTY':
        return '#ffa64d';
      default:
        return '#ff0080';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Automation Rules</Text>
          <Text style={styles.headerDescription}>
            Configure triggers that automatically unlock server access and reward loyal customers
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          onPress={handleCreate}
        >
          <Plus size={20} color="#0a0a0f" />
          <Text style={styles.addButtonText}>Create New Rule</Text>
        </TouchableOpacity>

        <View style={styles.rulesContainer}>
          {rules.map(rule => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <View
                  style={[
                    styles.ruleTypeIndicator,
                    { backgroundColor: getRuleColor(rule.type) + '30' },
                  ]}
                >
                  <View
                    style={[
                      styles.ruleTypeDot,
                      { backgroundColor: getRuleColor(rule.type) },
                    ]}
                  />
                </View>
                <View style={styles.ruleHeaderInfo}>
                  <Text style={styles.ruleType}>
                    {rule.type.replace(/_/g, ' ')}
                  </Text>
                  <Switch
                    value={rule.isActive}
                    onValueChange={() => toggleRule(rule.id)}
                    trackColor={{ false: '#2a2a3e', true: '#ff008050' }}
                    thumbColor={rule.isActive ? '#ff0080' : '#666680'}
                  />
                </View>
              </View>

              <View style={styles.ruleBody}>
                <View style={styles.ruleSection}>
                  <Text style={styles.ruleSectionLabel}>Trigger</Text>
                  <Text style={styles.ruleSectionValue}>
                    {rule.trigger.condition}
                  </Text>
                  <View style={styles.thresholdRow}>
                    <Text style={styles.thresholdLabel}>Threshold:</Text>
                    <Text style={styles.thresholdValue}>
                      {rule.trigger.threshold}
                      {rule.trigger.timeWindow
                        ? ` in ${rule.trigger.timeWindow} days`
                        : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.ruleSection}>
                  <Text style={styles.ruleSectionLabel}>Reward</Text>
                  <Text style={styles.ruleSectionValue}>
                    Access to {rule.reward.serverAccess}
                  </Text>
                  {rule.reward.badgeType && (
                    <View style={styles.badgeRow}>
                      <Text style={styles.badgeLabel}>Badge:</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{rule.reward.badgeType}</Text>
                      </View>
                    </View>
                  )}
                  {rule.reward.notifyManager && (
                    <Text style={styles.notifyText}>
                      ✓ Notify manager when triggered
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.ruleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                  onPress={() => handleEdit(rule)}
                >
                  <Edit3 size={16} color="#00d4ff" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                  onPress={() => handleDelete(rule)}
                >
                  <Trash2 size={16} color="#ff6b6b" />
                  <Text style={[styles.actionButtonText, { color: '#ff6b6b' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1a1a2e', '#15151f']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Rule</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowEditModal(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Trigger Settings</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Threshold</Text>
                    <TextInput
                      style={styles.input}
                      value={editThreshold}
                      onChangeText={setEditThreshold}
                      keyboardType="numeric"
                      placeholder="Enter threshold value"
                      placeholderTextColor="#666"
                    />
                    <Text style={styles.inputHint}>
                      {editingRule?.type === 'SPENDING_TIER' ? 'Amount in dollars' : 'Number of visits/purchases'}
                    </Text>
                  </View>

                  {editingRule?.trigger.timeWindow !== undefined && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Time Window (days)</Text>
                      <TextInput
                        style={styles.input}
                        value={editTimeWindow}
                        onChangeText={setEditTimeWindow}
                        keyboardType="numeric"
                        placeholder="Leave empty for all-time"
                        placeholderTextColor="#666"
                      />
                      <Text style={styles.inputHint}>
                        Period within which the threshold must be met
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Reward Settings</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Server Access</Text>
                    <View style={styles.segmentedControl}>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          editServerAccess === 'PUBLIC_LOBBY' && styles.segmentButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditServerAccess('PUBLIC_LOBBY');
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            editServerAccess === 'PUBLIC_LOBBY' && styles.segmentButtonTextActive,
                          ]}
                        >
                          Public Lobby
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          editServerAccess === 'INNER_CIRCLE' && styles.segmentButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditServerAccess('INNER_CIRCLE');
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            editServerAccess === 'INNER_CIRCLE' && styles.segmentButtonTextActive,
                          ]}
                        >
                          Inner Circle
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Badge Type</Text>
                    <View style={styles.badgeSelector}>
                      {['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'].map((badge) => (
                        <TouchableOpacity
                          key={badge}
                          style={[
                            styles.badgeOption,
                            editBadgeType === badge && styles.badgeOptionActive,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditBadgeType(badge);
                          }}
                        >
                          <Text
                            style={[
                              styles.badgeOptionText,
                              editBadgeType === badge && styles.badgeOptionTextActive,
                            ]}
                          >
                            {badge}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowEditModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Save size={18} color="#0a0a0f" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1a1a2e', '#15151f']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Rule</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCreateModal(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Rule Type</Text>

                  <View style={styles.ruleTypeSelector}>
                    {[
                      { type: 'SPENDING_TIER' as VenueRule['type'], label: 'Spending Tier' },
                      { type: 'FREQUENCY_TIER' as VenueRule['type'], label: 'Frequency Tier' },
                      { type: 'SPECIFIC_PURCHASE' as VenueRule['type'], label: 'Specific Purchase' },
                      { type: 'PERFORMER_LOYALTY' as VenueRule['type'], label: 'Performer Loyalty' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.type}
                        style={[
                          styles.ruleTypeOption,
                          editRuleType === item.type && styles.ruleTypeOptionActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditRuleType(item.type);
                        }}
                      >
                        <View
                          style={[
                            styles.ruleTypeIndicatorSmall,
                            { backgroundColor: getRuleColor(item.type) + '30' },
                          ]}
                        >
                          <View
                            style={[
                              styles.ruleTypeDotSmall,
                              { backgroundColor: getRuleColor(item.type) },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.ruleTypeOptionText,
                            editRuleType === item.type && styles.ruleTypeOptionTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Trigger Settings</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Condition Description</Text>
                    <TextInput
                      style={styles.input}
                      value={editCondition}
                      onChangeText={setEditCondition}
                      placeholder="e.g., Spend $100 or more"
                      placeholderTextColor="#666"
                    />
                    <Text style={styles.inputHint}>
                      Human-readable description of when this rule triggers
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Threshold</Text>
                    <TextInput
                      style={styles.input}
                      value={editThreshold}
                      onChangeText={setEditThreshold}
                      keyboardType="numeric"
                      placeholder="Enter threshold value"
                      placeholderTextColor="#666"
                    />
                    <Text style={styles.inputHint}>
                      {editRuleType === 'SPENDING_TIER' ? 'Amount in dollars' : 'Number of visits/purchases'}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Time Window (days) - Optional</Text>
                    <TextInput
                      style={styles.input}
                      value={editTimeWindow}
                      onChangeText={setEditTimeWindow}
                      keyboardType="numeric"
                      placeholder="Leave empty for all-time"
                      placeholderTextColor="#666"
                    />
                    <Text style={styles.inputHint}>
                      Period within which the threshold must be met
                    </Text>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Reward Settings</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Server Access</Text>
                    <View style={styles.segmentedControl}>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          editServerAccess === 'PUBLIC_LOBBY' && styles.segmentButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditServerAccess('PUBLIC_LOBBY');
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            editServerAccess === 'PUBLIC_LOBBY' && styles.segmentButtonTextActive,
                          ]}
                        >
                          Public Lobby
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentButton,
                          editServerAccess === 'INNER_CIRCLE' && styles.segmentButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditServerAccess('INNER_CIRCLE');
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            editServerAccess === 'INNER_CIRCLE' && styles.segmentButtonTextActive,
                          ]}
                        >
                          Inner Circle
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Badge Type</Text>
                    <View style={styles.badgeSelector}>
                      {['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'].map((badge) => (
                        <TouchableOpacity
                          key={badge}
                          style={[
                            styles.badgeOption,
                            editBadgeType === badge && styles.badgeOptionActive,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditBadgeType(badge);
                          }}
                        >
                          <Text
                            style={[
                              styles.badgeOptionText,
                              editBadgeType === badge && styles.badgeOptionTextActive,
                            ]}
                          >
                            {badge}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.switchRow}>
                      <Text style={styles.inputLabel}>Notify Manager</Text>
                      <Switch
                        value={editNotifyManager}
                        onValueChange={(value) => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditNotifyManager(value);
                        }}
                        trackColor={{ false: '#2a2a3e', true: '#ff008050' }}
                        thumbColor={editNotifyManager ? '#ff0080' : '#666680'}
                      />
                    </View>
                    <Text style={styles.inputHint}>
                      Send notification when this rule is triggered
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveCreate}
                >
                  <Plus size={18} color="#0a0a0f" />
                  <Text style={styles.saveButtonText}>Create Rule</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ff0080',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  rulesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  ruleCard: {
    backgroundColor: '#15151f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  ruleHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  ruleTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  ruleTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ruleHeaderInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  ruleType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    textTransform: 'capitalize' as const,
  },
  ruleBody: {
    gap: 16,
  },
  ruleSection: {
    gap: 8,
  },
  ruleSectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ff0080',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  ruleSectionValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  thresholdRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  thresholdLabel: {
    fontSize: 13,
    color: '#999',
  },
  thresholdValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#1f1f2e',
  },
  badgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  badgeLabel: {
    fontSize: 13,
    color: '#999',
  },
  badge: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  notifyText: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: '500' as const,
  },
  ruleActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1f1f2e',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#00d4ff',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalScroll: {
    maxHeight: 400,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff0080',
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#fff',
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  segmentedControl: {
    flexDirection: 'row' as const,
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#ff0080',
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  segmentButtonTextActive: {
    color: '#0a0a0f',
  },
  badgeSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  badgeOption: {
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: '#1f1f2e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  badgeOptionActive: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  badgeOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  badgeOptionTextActive: {
    color: '#ff0080',
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#999',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  ruleTypeSelector: {
    gap: 12,
  },
  ruleTypeOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: '#1f1f2e',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ruleTypeOptionActive: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(255, 0, 128, 0.05)',
  },
  ruleTypeIndicatorSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ruleTypeDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ruleTypeOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#999',
  },
  ruleTypeOptionTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
});
