# Real-time Metrics Implementation

This document describes the implementation of real-time metrics updates for the Expose Corner feature, including optimistic updates, error recovery, and persistence mechanisms.

## Overview

The real-time metrics system provides immediate user feedback for interactions (votes, comments, views, shares) while ensuring data consistency and graceful error handling. The implementation follows these key principles:

1. **Optimistic Updates**: UI updates immediately on user action
2. **Error Recovery**: Automatic retry with exponential backoff
3. **Persistence**: Metrics survive page refreshes and maintain consistency
4. **Graceful Degradation**: System continues to work even when some operations fail

## Architecture

### Core Components

#### 1. `useRealTimeMetrics` Hook (`lib/hooks/useRealTimeMetrics.ts`)

The central hook that manages all real-time metrics functionality:

```typescript
interface MetricsState {
  views: number;
  comments: number;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  shares: number;
}

interface UseRealTimeMetricsReturn {
  metrics: MetricsState;
  isUpdating: boolean;
  updateVote: (voteType: "upvote" | "downvote") => Promise<boolean>;
  updateComment: (increment: number) => Promise<boolean>;
  updateView: () => Promise<boolean>;
  updateShare: () => Promise<boolean>;
  refreshMetrics: () => Promise<void>;
  hasOptimisticUpdates: boolean;
}
```

**Key Features:**

- Manages optimistic updates with unique IDs
- Implements retry logic with exponential backoff
- Handles concurrent updates gracefully
- Provides cleanup for memory management

#### 2. API Endpoints

##### Vote API (`/api/expose/vote`)

- **POST**: Records upvote or downvote
- **Validation**: Ensures expose exists and is not expired
- **Atomicity**: Uses MongoDB atomic operations

##### Views API (`/api/expose/views`)

- **POST**: Tracks post views with session-based deduplication
- **Session Management**: Generates consistent session IDs from client info
- **Duplicate Prevention**: Prevents multiple views from same session

##### Share API (`/api/expose/share`)

- **POST**: Records share actions
- **Atomicity**: Increments share count atomically

##### Comments API (`/api/expose/comments`)

- **GET**: Retrieves comments with pagination
- **POST**: Creates new comments with rate limiting

#### 3. Enhanced Components

##### `RealTimeExposeCard` (`components/RealTimeExposeCard.tsx`)

Wrapper component that integrates real-time metrics with ExposeCard:

- Automatic view tracking on mount
- Real-time vote handling
- Comment count synchronization
- Periodic metrics refresh

##### `ExposeCard` (Enhanced)

Updated to use real-time metrics:

- Displays live metrics from hook
- Shows optimistic update indicators
- Handles loading states

## Implementation Details

### Optimistic Updates

When a user performs an action (vote, comment, etc.), the system:

1. **Immediately updates the UI** with the expected result
2. **Assigns a unique ID** to the optimistic update
3. **Sends the API request** in the background
4. **Updates with server response** when successful
5. **Reverts on failure** after retry attempts

```typescript
const updateVote = useCallback(
  async (voteType: "upvote" | "downvote"): Promise<boolean> => {
    const updateId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentMetrics = getCurrentMetrics();

    // Apply optimistic update immediately
    const optimisticData = {
      upvotes:
        voteType === "upvote"
          ? currentMetrics.upvotes + 1
          : currentMetrics.upvotes,
      downvotes:
        voteType === "downvote"
          ? currentMetrics.downvotes + 1
          : currentMetrics.downvotes,
      netVotes:
        voteType === "upvote"
          ? currentMetrics.netVotes + 1
          : currentMetrics.netVotes - 1,
    };

    applyOptimisticUpdate({
      id: updateId,
      type: "vote",
      data: optimisticData,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Perform actual API call
    const success = await performVoteUpdate(update);
    if (!success) {
      await retryUpdate(update);
    }
    return success;
  },
  [getCurrentMetrics, applyOptimisticUpdate, performVoteUpdate, retryUpdate]
);
```

### Error Recovery

The system implements robust error recovery:

#### Retry Logic

- **Exponential Backoff**: Delays increase exponentially (1s, 2s, 4s, 8s)
- **Maximum Attempts**: Up to 3 retry attempts per operation
- **Abort Controllers**: Allows cancellation of in-flight requests

#### Error Handling

- **Network Errors**: Automatic retry with backoff
- **Server Errors**: Retry with different strategies based on error type
- **Timeout Handling**: 15-second timeout for API calls
- **Graceful Degradation**: UI remains functional even when APIs fail

```typescript
const retryUpdate = useCallback(
  async (update: OptimisticUpdate) => {
    if (update.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.warn(`Max retry attempts reached for update ${update.id}`);
      removeOptimisticUpdate(update.id);
      return false;
    }

    const delay = RETRY_DELAY * Math.pow(2, update.retryCount); // Exponential backoff

    const timeoutId = setTimeout(async () => {
      const updatedUpdate = { ...update, retryCount: update.retryCount + 1 };
      const success = await performUpdate(updatedUpdate);
      if (!success) {
        await retryUpdate(updatedUpdate);
      }
    }, delay);
  },
  [removeOptimisticUpdate]
);
```

### Persistence

Metrics persist across page refreshes through:

#### Server-side State

- All metrics stored in MongoDB
- Atomic operations ensure consistency
- Proper indexing for performance

#### Client-side Refresh

- Initial metrics loaded from server on page load
- Periodic refresh (every 30 seconds when no optimistic updates)
- Manual refresh capability

#### Session Management

- Consistent session IDs for view tracking
- IP-based deduplication for anonymous users
- TTL (Time To Live) for cleanup

### Concurrent Updates

The system handles concurrent updates gracefully:

#### Update Queuing

- Each update gets a unique ID
- Multiple updates can be in progress simultaneously
- Updates are resolved independently

#### Conflict Resolution

- Server state is the source of truth
- Optimistic updates are replaced with server responses
- Conflicting updates are handled by last-write-wins

#### Race Condition Prevention

- Abort controllers cancel outdated requests
- Unique update IDs prevent duplicate processing
- Atomic database operations ensure consistency

## Usage Examples

### Basic Integration

```typescript
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";

function MyExposeCard({ expose }) {
  const {
    metrics,
    isUpdating,
    updateVote,
    updateComment,
    updateView,
    hasOptimisticUpdates,
  } = useRealTimeMetrics({
    exposeId: expose.exposeId,
    initialMetrics: {
      views: expose.views || 0,
      comments: expose.commentCount || 0,
      upvotes: expose.upvotes || 0,
      downvotes: expose.downvotes || 0,
      netVotes: expose.netVotes || 0,
      shares: expose.shareCount || 0,
    },
    onMetricsChange: (newMetrics) => {
      console.log("Metrics updated:", newMetrics);
    },
  });

  const handleUpvote = async () => {
    await updateVote("upvote");
  };

  return (
    <div>
      <div>Views: {metrics.views}</div>
      <div>Comments: {metrics.comments}</div>
      <button onClick={handleUpvote} disabled={isUpdating}>
        Upvote ({metrics.upvotes})
      </button>
      {hasOptimisticUpdates && <span>Updating...</span>}
    </div>
  );
}
```

### Advanced Integration with Error Handling

```typescript
function AdvancedExposeCard({ expose }) {
  const [error, setError] = useState(null);

  const {
    metrics,
    updateVote,
    refreshMetrics,
  } = useRealTimeMetrics({
    exposeId: expose.exposeId,
    initialMetrics: getInitialMetrics(expose),
  });

  const handleVoteWithErrorHandling = async (voteType) => {
    try {
      const success = await updateVote(voteType);
      if (!success) {
        setError("Vote failed. Please try again.");
        // Optionally refresh metrics to ensure consistency
        await refreshMetrics();
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleVoteWithErrorHandling("upvote")}>
        Upvote
      </button>
    </div>
  );
}
```

## Testing

### Unit Tests

- Hook functionality testing
- Error scenario simulation
- Metrics calculation verification

### Integration Tests

- End-to-end optimistic update flow
- Error recovery mechanisms
- Concurrent update handling

### Manual Testing

- Use `/test-real-time-metrics` page for interactive testing
- Monitor network tab for API calls
- Test with network throttling and failures

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Prevent rapid successive API calls
2. **Batching**: Group related updates when possible
3. **Caching**: Cache metrics for short periods
4. **Lazy Loading**: Only load metrics when needed

### Memory Management

- Cleanup timeouts and abort controllers on unmount
- Remove completed optimistic updates
- Limit retry attempts to prevent memory leaks

### Database Performance

- Proper indexing on frequently queried fields
- Atomic operations for consistency
- TTL indexes for automatic cleanup

## Security Considerations

### Rate Limiting

- Comment submission rate limits
- Vote spam prevention
- View tracking deduplication

### Data Privacy

- Anonymous user identification
- IP address hashing
- Session-based tracking without personal data

### Input Validation

- Server-side validation for all inputs
- Sanitization of user content
- Proper error messages without information leakage

## Monitoring and Analytics

### Metrics to Track

- Update success/failure rates
- Average response times
- Retry attempt frequencies
- User engagement patterns

### Error Monitoring

- Failed API calls
- Timeout occurrences
- Retry exhaustion events
- Client-side errors

### Performance Monitoring

- Database query performance
- API response times
- Client-side rendering performance
- Memory usage patterns

## Future Enhancements

### Potential Improvements

1. **WebSocket Integration**: Real-time updates across multiple clients
2. **Offline Support**: Queue updates when offline
3. **Advanced Caching**: Redis-based caching for high-traffic scenarios
4. **Analytics Dashboard**: Real-time metrics visualization
5. **A/B Testing**: Test different update strategies

### Scalability Considerations

- Horizontal scaling of API endpoints
- Database sharding for large datasets
- CDN integration for global performance
- Microservices architecture for complex scenarios

## Troubleshooting

### Common Issues

#### Metrics Not Updating

- Check network connectivity
- Verify API endpoint availability
- Ensure proper expose ID format
- Check browser console for errors

#### Optimistic Updates Stuck

- Clear browser cache and localStorage
- Check for JavaScript errors
- Verify hook cleanup on component unmount

#### Performance Issues

- Monitor database query performance
- Check for memory leaks in browser
- Verify proper cleanup of timeouts/controllers
- Consider reducing update frequency

### Debug Tools

- Browser developer tools network tab
- React Developer Tools for hook state
- Database query profiling
- Server-side logging and monitoring

## Conclusion

The real-time metrics implementation provides a robust, user-friendly system for handling user interactions with immediate feedback and reliable persistence. The combination of optimistic updates, error recovery, and graceful degradation ensures a smooth user experience even under adverse conditions.

The modular design allows for easy testing, maintenance, and future enhancements while maintaining high performance and security standards.
