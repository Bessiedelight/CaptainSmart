# CommentSection Component

A React component for displaying and managing comments on expose posts with pagination, loading states, and error handling.

## Features

- **Expandable/Collapsible**: Comments section can be toggled open/closed
- **Pagination**: Load more comments functionality with proper pagination
- **Loading States**: Skeleton loading and loading indicators
- **Error Handling**: Graceful error handling with retry functionality
- **Anonymous Users**: Displays anonymous user identifiers
- **Real-time Updates**: Updates comment counts when new comments are added
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Props

```typescript
interface CommentSectionProps {
  exposeId: string; // The ID of the expose post
  initialCommentCount: number; // Initial comment count to display
  onCommentCountChange: (count: number) => void; // Callback when count changes
}
```

## Usage

### Basic Usage

```tsx
import CommentSection from "@/components/CommentSection";

function ExposePost({ expose }) {
  const [commentCount, setCommentCount] = useState(expose.commentCount || 0);

  return (
    <div className="expose-post">
      {/* Your expose content */}

      <CommentSection
        exposeId={expose.exposeId}
        initialCommentCount={commentCount}
        onCommentCountChange={setCommentCount}
      />
    </div>
  );
}
```

### Advanced Usage with State Management

```tsx
import { useState, useCallback } from "react";
import CommentSection from "@/components/CommentSection";

function ExposeCard({ expose, onExposeUpdate }) {
  const handleCommentCountChange = useCallback(
    (newCount: number) => {
      // Update local state
      setExpose((prev) => ({ ...prev, commentCount: newCount }));

      // Notify parent component
      onExposeUpdate?.({ ...expose, commentCount: newCount });

      // Optional: Update analytics or other services
      analytics.track("comment_count_changed", {
        exposeId: expose.exposeId,
        newCount,
      });
    },
    [expose, onExposeUpdate]
  );

  return (
    <article className="expose-card">
      {/* Expose content */}

      <CommentSection
        exposeId={expose.exposeId}
        initialCommentCount={expose.commentCount || 0}
        onCommentCountChange={handleCommentCountChange}
      />
    </article>
  );
}
```

## API Integration

The component expects the following API endpoint to be available:

### GET /api/expose/comments

**Query Parameters:**

- `exposeId` (required): The expose ID
- `limit` (optional): Number of comments per page (default: 10, max: 50)
- `offset` (optional): Number of comments to skip (default: 0)
- `sort` (optional): Sort order - "newest" or "oldest" (default: "newest")

**Response Format:**

```typescript
{
  success: true,
  data: {
    comments: Comment[],
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    },
    exposeId: string
  }
}
```

**Comment Object:**

```typescript
{
  _id: string,
  commentId: string,
  exposeId: string,
  content: string,
  anonymousId: string,
  timeAgo: string,
  createdAt: string
}
```

## States

### Loading States

- **Initial Loading**: Shows skeleton placeholders when first loading comments
- **Load More Loading**: Shows spinner when loading additional comments
- **Empty State**: Shows message when no comments exist

### Error States

- **Network Error**: Handles connection issues
- **Server Error**: Handles API errors
- **Timeout Error**: Handles request timeouts
- **Retry Functionality**: Allows users to retry failed requests

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- **Colors**: Gray scale with blue accents for interactive elements
- **Typography**: Consistent with app typography scale
- **Spacing**: Uses standard spacing scale (p-4, space-x-3, etc.)
- **Animations**: Smooth transitions for expand/collapse and loading states

### Customization

You can customize the appearance by modifying the CSS classes in the component:

```tsx
// Example: Custom styling
<CommentSection
  exposeId={exposeId}
  initialCommentCount={count}
  onCommentCountChange={handleChange}
  className="custom-comment-section" // Add custom classes
/>
```

## Accessibility

- **ARIA Labels**: Proper labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Screen Reader Support**: Announces state changes

## Performance

- **Lazy Loading**: Comments are only loaded when section is expanded
- **Pagination**: Efficient loading of large comment lists
- **Request Debouncing**: Prevents duplicate API calls
- **Memory Management**: Proper cleanup of event listeners

## Error Handling

The component handles various error scenarios:

1. **Network Errors**: Connection issues, timeouts
2. **API Errors**: Server errors, validation errors
3. **Data Errors**: Malformed responses, missing data
4. **User Errors**: Invalid interactions, rate limiting

## Testing

The component includes comprehensive tests:

```bash
# Run tests
npm test CommentSection.test.tsx

# Run with coverage
npm test CommentSection.test.tsx --coverage
```

Test coverage includes:

- Rendering with different props
- Expand/collapse functionality
- API integration and error handling
- Loading states and pagination
- User interactions and callbacks

## Dependencies

- **React**: ^18.0.0
- **Lucide React**: For icons
- **Tailwind CSS**: For styling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration Guide

If upgrading from a previous version:

### From v1.x to v2.x

- `onCommentAdd` prop renamed to `onCommentCountChange`
- Added required `initialCommentCount` prop
- Updated API response format

## Contributing

When contributing to this component:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure accessibility compliance
5. Test on multiple devices/browsers

## Troubleshooting

### Common Issues

**Comments not loading:**

- Check API endpoint is available
- Verify exposeId format (should start with "expose\_")
- Check network connectivity

**Styling issues:**

- Ensure Tailwind CSS is properly configured
- Check for CSS conflicts
- Verify responsive breakpoints

**Performance issues:**

- Check comment count (large lists may need optimization)
- Monitor API response times
- Consider implementing virtual scrolling for very large lists

### Debug Mode

Enable debug logging:

```tsx
// Add to your environment variables
NEXT_PUBLIC_DEBUG_COMMENTS = true;
```

This will log API requests, responses, and state changes to the console.
