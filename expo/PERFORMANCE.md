# Performance Optimization Guide

This guide covers performance optimizations implemented in the Nox Nightlife App, including memoization, lazy loading, and best practices.

## Table of Contents
1. [React.memo Usage](#reactmemo-usage)
2. [useMemo Hook](#usememo-hook)
3. [useCallback Hook](#usecallback-hook)
4. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
5. [List Optimization](#list-optimization)
6. [Image Optimization](#image-optimization)
7. [Map Optimization](#map-optimization)
8. [General Best Practices](#general-best-practices)

---

## React.memo Usage

`React.memo` prevents unnecessary re-renders of functional components by memoizing the result.

### When to Use
- Components that render often with the same props
- Pure components (output depends only on props)
- List items
- Complex components with expensive render logic

### When NOT to Use
- Components that always receive new props
- Simple components (overhead > benefit)
- Components that rarely re-render

### Examples

#### Before (No Optimization)
```typescript
// GigCard.tsx - Re-renders on every parent update
export const GigCard: React.FC<GigCardProps> = ({ gig, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      {/* ... */}
    </TouchableOpacity>
  );
};
```

#### After (Optimized)
```typescript
// GigCard.tsx - Only re-renders when gig or onPress changes
export const GigCard = React.memo<GigCardProps>(({ gig, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      {/* ... */}
    </TouchableOpacity>
  );
});

// With custom comparison function
export const GigCard = React.memo<GigCardProps>(
  ({ gig, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress}>
        {/* ... */}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (don't re-render)
    return prevProps.gig.id === nextProps.gig.id &&
           prevProps.gig.status === nextProps.gig.status;
  }
);
```

---

## useMemo Hook

`useMemo` memoizes expensive calculations to avoid recomputing on every render.

### When to Use
- Expensive computations (sorting, filtering large arrays)
- Creating objects/arrays passed as props
- Complex calculations derived from state

### Examples

#### Before (Recomputes Every Render)
```typescript
function AnalyticsScreen() {
  const { transactions } = useTransactions();

  // Recalculates on every render, even if transactions didn't change
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = totalRevenue / transactions.length;
  const topVenues = transactions
    .reduce((acc, t) => {
      // ... grouping logic
    }, {})
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return <View>{/* ... */}</View>;
}
```

#### After (Optimized)
```typescript
function AnalyticsScreen() {
  const { transactions } = useTransactions();

  // Only recalculates when transactions change
  const analytics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = totalRevenue / transactions.length;
    const topVenues = transactions
      .reduce((acc, t) => {
        // ... grouping logic
      }, {})
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalRevenue, averageTransaction, topVenues };
  }, [transactions]);

  return <View>{/* ... */}</View>;
}
```

---

## useCallback Hook

`useCallback` memoizes function references to prevent child components from re-rendering.

### When to Use
- Functions passed to memoized child components
- Functions used as dependencies in other hooks
- Event handlers passed to expensive components

### Examples

#### Before (New Function on Every Render)
```typescript
function FeedScreen() {
  const [videos, setVideos] = useState([]);

  // New function reference on every render = child re-renders
  const handleVideoLike = (videoId: string) => {
    // Like logic...
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard video={item} onLike={handleVideoLike} />
      )}
    />
  );
}
```

#### After (Optimized)
```typescript
function FeedScreen() {
  const [videos, setVideos] = useState([]);

  // Same function reference across renders
  const handleVideoLike = useCallback((videoId: string) => {
    // Like logic...
  }, []); // Empty deps = never recreated

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard video={item} onLike={handleVideoLike} />
      )}
    />
  );
}
```

#### With Dependencies
```typescript
function VenueScreen({ venueId }: Props) {
  const [isLiked, setIsLiked] = useState(false);

  // Recreates when venueId or isLiked changes
  const handleToggleLike = useCallback(() => {
    api.post(`/venues/${venueId}/like`, { liked: !isLiked });
    setIsLiked(!isLiked);
  }, [venueId, isLiked]);

  return <LikeButton onPress={handleToggleLike} />;
}
```

---

## Code Splitting & Lazy Loading

Reduce initial bundle size by loading screens on-demand.

### Expo Router (File-based)
Already optimized - each route in `app/` directory is automatically code-split.

### Dynamic Imports
```typescript
// Heavy chart library - load only when needed
const ChartComponent = lazy(() => import('@/components/Charts'));

function AnalyticsScreen() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <ChartComponent data={chartData} />
    </Suspense>
  );
}
```

---

## List Optimization

Large lists can cause performance issues if not optimized properly.

### Use FlatList with Key Optimizations

#### Before (Performance Issues)
```typescript
<ScrollView>
  {videos.map((video) => (
    <VideoCard key={video.id} video={video} />
  ))}
</ScrollView>
```

#### After (Optimized)
```typescript
<FlatList
  data={videos}
  renderItem={({ item }) => <VideoCard video={item} />}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews={true} // Unmount off-screen items
  maxToRenderPerBatch={10} // Render 10 items per batch
  updateCellsBatchingPeriod={50} // Batch updates every 50ms
  initialNumToRender={5} // Render 5 items initially
  windowSize={5} // Keep 5 screens worth of items in memory
  getItemLayout={(data, index) => ({
    // If items have fixed height, provide this for better performance
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoize renderItem
```typescript
const renderItem = useCallback(({ item }: { item: Video }) => {
  return <VideoCard video={item} />;
}, []);

<FlatList data={videos} renderItem={renderItem} />
```

---

## Image Optimization

Images can be a major performance bottleneck.

### Use expo-image Instead of Image
```typescript
import { Image } from 'expo-image';

// Optimized image component with caching
<Image
  source={{ uri: venue.imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk" // Cache aggressively
/>
```

### Lazy Load Images
```typescript
<FlatList
  data={venues}
  renderItem={({ item }) => (
    <Image
      source={{ uri: item.imageUrl }}
      placeholder={blurhash} // Show placeholder while loading
      priority="low" // Load on-screen images first
    />
  )}
/>
```

---

## Map Optimization

Maps with many markers can be slow.

### Cluster Markers
```typescript
import MapView, { Marker } from 'react-native-maps';
import Supercluster from 'supercluster';

function DiscoveryMap() {
  const venues = useVenues();

  // Cluster nearby markers
  const clusters = useMemo(() => {
    const cluster = new Supercluster({ radius: 40, maxZoom: 16 });
    cluster.load(venues.map(v => ({
      type: 'Feature',
      geometry: { coordinates: [v.longitude, v.latitude] },
      properties: v,
    })));
    return cluster.getClusters([-180, -85, 180, 85], zoom);
  }, [venues, zoom]);

  return (
    <MapView>
      {clusters.map((cluster) => (
        <Marker key={cluster.id} coordinate={cluster.geometry.coordinates} />
      ))}
    </MapView>
  );
}
```

### Virtualize Markers (Only Render Visible)
```typescript
function DiscoveryMap() {
  const [region, setRegion] = useState(initialRegion);
  const venues = useVenues();

  // Only render venues in current viewport
  const visibleVenues = useMemo(() => {
    return venues.filter((venue) => {
      const { latitude, longitude } = venue.location;
      return (
        latitude >= region.latitude - region.latitudeDelta / 2 &&
        latitude <= region.latitude + region.latitudeDelta / 2 &&
        longitude >= region.longitude - region.longitudeDelta / 2 &&
        longitude <= region.longitude + region.longitudeDelta / 2
      );
    });
  }, [venues, region]);

  return (
    <MapView onRegionChangeComplete={setRegion}>
      {visibleVenues.map((venue) => (
        <Marker key={venue.id} coordinate={venue.location} />
      ))}
    </MapView>
  );
}
```

---

## General Best Practices

### 1. Avoid Inline Objects/Arrays as Props
```typescript
// BAD - Creates new object every render
<Component style={{ margin: 10 }} />

// GOOD - Reuses same object
const styles = StyleSheet.create({
  container: { margin: 10 },
});
<Component style={styles.container} />
```

### 2. Avoid Inline Functions in Render
```typescript
// BAD - New function every render
<TouchableOpacity onPress={() => navigate('Details')}>

// GOOD - Memoized callback
const handlePress = useCallback(() => navigate('Details'), []);
<TouchableOpacity onPress={handlePress}>
```

### 3. Use React Query for Data Fetching
Already implemented! React Query automatically:
- Caches data
- Deduplicates requests
- Provides stale-while-revalidate
- Handles loading/error states

### 4. Throttle/Debounce Expensive Operations
```typescript
import { useMemo } from 'react';

function SearchScreen() {
  const [query, setQuery] = useState('');

  // Debounce search to avoid excessive API calls
  const debouncedQuery = useMemo(() => {
    return debounce(query, 300);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

### 5. Use Platform-Specific Code
```typescript
import { Platform } from 'react-native';

// Android has better performance with certain optimizations
const useNativeDriver = Platform.OS === 'android';

Animated.timing(value, {
  toValue: 1,
  useNativeDriver, // Runs animation on native thread
}).start();
```

---

## Measuring Performance

### React DevTools Profiler
```bash
# Install React DevTools
npm install -g react-devtools

# Run profiler
react-devtools
```

### Flashlight (React Native Profiler)
```bash
# Install
npm install -g @perf-profiler/profiler

# Profile your app
flashlight measure
```

### Manual Performance Logging
```typescript
const ComponentWithPerf = () => {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    console.log(`Component rendered in ${endTime - startTime}ms`);
  });

  return <View />;
};
```

---

## Checklist

Before deploying, ensure:
- [ ] Heavy computations use `useMemo`
- [ ] Event handlers use `useCallback`
- [ ] List items use `React.memo`
- [ ] Lists use `FlatList` with optimizations
- [ ] Images use `expo-image` with caching
- [ ] Maps use clustering/virtualization
- [ ] No inline objects/arrays as props
- [ ] No anonymous functions in render
- [ ] React Query configured for caching
- [ ] Large libraries lazy-loaded

---

## Further Reading

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
