import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { Gig } from '@/types';

export interface CarouselProps {
  title: string;
  data: Gig[];
  renderItem: (gig: Gig) => React.ReactNode;
  emptyMessage: string;
}

const MAX_ITEMS = 20;

/**
 * Horizontal scrolling carousel with a section title.
 * Renders up to 20 gig items via the provided renderItem function.
 * Shows an EmptyState message when no data is available.
 */
export function Carousel({ title, data, renderItem, emptyMessage }: CarouselProps) {
  const textColor = useThemeColor({}, 'text');
  const items = data.slice(0, MAX_ITEMS);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.item}>{renderItem(item)}</View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
  },
  item: {
    marginRight: Spacing.two,
  },
});
