import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Settings screen — accessible from the Profile hub.
 * Provides theme selection, notification preferences, and account options.
 */
export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <ThemeOption
            label="System"
            selected={true}
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThemeOption
            label="Light"
            selected={false}
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThemeOption
            label="Dark"
            selected={false}
            colors={colors}
            onPress={() => {}}
          />
        </View>
        <Text style={[styles.sectionFooter, { color: colors.textSecondary }]}>
          Choose how Transient looks. System uses your device setting.
        </Text>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <SettingsRow
            icon="musical-notes-outline"
            label="New gig alerts"
            value="On"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="chatbubble-outline"
            label="Application updates"
            value="On"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="radio-outline"
            label="Amplify pushes"
            value="On"
            colors={colors}
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <SettingsRow
            icon="mail-outline"
            label="Email"
            value="user@example.com"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="lock-closed-outline"
            label="Change password"
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.menuItem}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Delete Account</Text>
          </Pressable>
        </View>

        {/* App info */}
        <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
          Transient v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeOption({
  label,
  selected,
  colors,
  onPress,
}: {
  label: string;
  selected: boolean;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[styles.menuItemText, { color: colors.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color={Brand.purple} />}
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value?: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.menuItem}>
      <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
      <Text style={[styles.menuItemText, { color: colors.text }]}>{label}</Text>
      {value && <Text style={[styles.menuItemValue, { color: colors.textSecondary }]}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    paddingHorizontal: 4,
  },
  sectionFooter: {
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  menuSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemValue: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.five,
  },
});
