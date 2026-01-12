import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useState, useCallback, useMemo } from "react";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "@/components/themed-text";

interface OptimizedListProps<T> {
  data: T[];
  renderItem: ({
    item,
    index,
  }: {
    item: T;
    index: number;
  }) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  refreshing?: boolean;
  emptyMessage?: string;
  itemHeight?: number;
  estimatedItemSize?: number;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  showsVerticalScrollIndicator?: boolean;
  numColumns?: number;
  initialNumToRender?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onRefresh,
  loading = false,
  refreshing = false,
  emptyMessage = "No items found",
  itemHeight,
  estimatedItemSize = 100,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  showsVerticalScrollIndicator = false,
  numColumns = 1,
  initialNumToRender = 10,
  windowSize = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
}: OptimizedListProps<T>) {
  const [refreshingState, setRefreshingState] = useState(false);
  const scrollY = new Animated.Value(0);
  const textColor = useThemeColor({}, "text");

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshingState(true);
      try {
        await onRefresh();
      } finally {
        setRefreshingState(false);
      }
    }
  }, [onRefresh]);

  const handleEndReached = useCallback(() => {
    if (onEndReached && !loading) {
      onEndReached();
    }
  }, [onEndReached, loading]);

  const renderEmptyComponent = useCallback(() => {
    if (ListEmptyComponent) {
      if (typeof ListEmptyComponent === "function") {
        return React.createElement(ListEmptyComponent as any);
      }
      return ListEmptyComponent;
    }
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
      </View>
    );
  }, [emptyMessage, ListEmptyComponent]);

  const renderFooterComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={textColor} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    if (ListFooterComponent) {
      if (typeof ListFooterComponent === "function") {
        return React.createElement(ListFooterComponent as any);
      }
      return ListFooterComponent;
    }
    return null;
  }, [loading, ListFooterComponent, textColor]);

  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      if (!itemHeight) {
        return {
          length: estimatedItemSize,
          offset: estimatedItemSize * index,
          index,
        };
      }
      return { length: itemHeight, offset: itemHeight * index, index };
    },
    [itemHeight, estimatedItemSize],
  );

  const animatedHeaderStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [-100, 0, 100],
            outputRange: [-50, 0, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    }),
    [scrollY],
  );

  return (
    <AnimatedFlatList
      data={data as any}
      renderItem={renderItem as any}
      keyExtractor={keyExtractor as any}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
        },
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || refreshingState}
            onRefresh={handleRefresh}
            tintColor={textColor}
            title="Refreshing..."
            titleColor={textColor}
          />
        ) : undefined
      }
      ListEmptyComponent={renderEmptyComponent as any}
      ListFooterComponent={renderFooterComponent as any}
      ListHeaderComponent={
        ListHeaderComponent ? (
          <Animated.View style={[animatedHeaderStyle]}>
            {typeof ListHeaderComponent === "function"
              ? React.createElement(ListHeaderComponent as any)
              : ListHeaderComponent}
          </Animated.View>
        ) : undefined
      }
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      numColumns={numColumns}
      initialNumToRender={initialNumToRender}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={true}
      getItemLayout={itemHeight ? (getItemLayout as any) : undefined}
      contentContainerStyle={styles.listContent}
      style={styles.list}
    />
  );
}

interface SkeletonListProps {
  itemCount: number;
  renderItem: (index: number) => React.ReactNode;
  loading?: boolean;
}

export function SkeletonList({
  itemCount,
  renderItem,
  loading = true,
}: SkeletonListProps) {
  const textColor = useThemeColor({}, "text");

  if (!loading) {
    return (
      <View>
        {Array.from({ length: itemCount }, (_, index) => (
          <React.Fragment key={index}>{renderItem(index)}</React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View>
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: textColor, opacity: 0.2 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: textColor, opacity: 0.1, width: "80%" },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: textColor, opacity: 0.1, width: "60%" },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight: number;
  containerHeight: number;
  estimatedItemSize?: number;
  onEndReached?: () => void;
  loading?: boolean;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  containerHeight,
  estimatedItemSize = itemHeight,
  onEndReached,
  loading = false,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const textColor = useThemeColor({}, "text");

  const handleScroll = useCallback(
    (event: any) => {
      const newScrollTop = event.nativeEvent.contentOffset.y;
      setScrollTop(newScrollTop);

      // Calculate visible range with overscan
      const overscan = 5;
      const startIndex = Math.max(
        0,
        Math.floor(newScrollTop / itemHeight) - overscan,
      );
      const endIndex = Math.min(
        data.length - 1,
        Math.ceil((newScrollTop + containerHeight) / itemHeight) + overscan,
      );

      setVisibleRange({ start: startIndex, end: endIndex });
    },
    [data.length, itemHeight, containerHeight],
  );

  const visibleItems = useMemo(() => {
    return data
      .slice(visibleRange.start, visibleRange.end + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.start + index,
      }));
  }, [data, visibleRange]);

  const totalHeight = data.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <View style={{ height: containerHeight, overflow: "hidden" }}>
      <Animated.ScrollView
        style={styles.virtualizedContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: totalHeight, position: "relative" }}>
          <View style={{ transform: [{ translateY: offsetY }] }}>
            {visibleItems.map(({ item, index }) => (
              <View
                key={keyExtractor(item, index)}
                style={{ height: itemHeight }}
              >
                {renderItem({ item, index })}
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {loading && (
        <View style={styles.virtualizedLoading}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  skeletonItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  virtualizedContainer: {
    flex: 1,
  },
  virtualizedLoading: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
