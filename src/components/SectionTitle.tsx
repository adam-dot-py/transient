import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ProfileAvatarMenu } from '@/components/ProfileAvatarMenu';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SectionTitleProps {
  sectionName: string;
  /** Whether to show the profile avatar on the left. Defaults to true. */
  showAvatar?: boolean;
}

/**
 * SectionTitle — Large bold section heading with optional profile avatar
 * positioned to the left of the title.
 */
export function SectionTitle({ sectionName, showAvatar = true }: SectionTitleProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      {showAvatar && <ProfileAvatarMenu />}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {sectionName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
    flex: 1,
  },
});
