import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface StatItem {
  number: string;
  label: string;
  color: string;
}

interface HeroStatsCardProps {
  stats: StatItem[];
}

/**
 * HeroStatsCard — A gradient summary card displaying key musician statistics.
 *
 * Renders stat items in a horizontal row with equal-width boxes.
 * Each stat shows a bold colored number above a secondary-colored label.
 * The card has a blue-to-purple linear gradient background with rounded corners.
 */
export function HeroStatsCard({ stats }: HeroStatsCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[semantic.gradientStart, semantic.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statBox}>
              <Text style={[styles.statNumber, { color: stat.color }]}>
                {stat.number}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
