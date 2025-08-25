# Design Document

## Overview

This design document outlines the technical approach for enhancing the Expose Corner functionality in the CaptainSmart application. The enhancements focus on four main areas: error resolution, anonymous commenting system, post metrics tracking, and user experience improvements. The design maintains the existing MongoDB-based architecture while adding new data models and API endpoints to support the enhanced functionality.

## Architecture

### Current Architecture

- **Frontend**: Next.js 15 with TypeScript and React
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS with custom animations using GSAP
- **State Management**: React hooks with optimistic updates

### Enhanced Architecture

The enhanced system will extend the current architecture with:

- **Comment Service**: New API endpoints for comment management
- **Metrics Service**: View tracking and engagement analytics
- **Real-time Updates**: Optimistic UI updates for better user experience
- **Error Handling**: Comprehensive error boundaries and validation

## Components and Interfaces

### 1. Database Models

#### Enhanced Expose Model

```typescript
interface IExpose extends Document {
  exposeId: string;
  title: string;
  description: string;
  hashtag: string;
  imageUrls: string[];
  audioUrl?: string;
  upvotes: number;
  downvotes: number;
  views: number; // NEW
  commentCount: number; // NEW
  shareCount: number; // NEW
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### New Comment Model

```typescript
interface IComment extends Document {
  commentId: string;
  exposeId: string;
  content: string;
  anonymousId: string; // Generated identifier for anonymous users
  ipHash: string; // Hashed IP for basic spam prevention
  createdAt: Date;
  updatedAt: Date;
}
```

#### New View Tracking Model

```typescript
interface IViewTracking extends Document {
  exposeId: string;
  sessionId: string; // To prevent duplicate counting
  ipHash: string;
  userAgent: string;
  viewedAt: Date;
}
```

### 2. API Endpoints

#### Comments API (`/api/expose/comments`)

- **GET**: Retrieve comments for a specific expose with pagination
- **POST**: Create a new comment for an expose

#### Metrics API (`/api/expose/metrics`)

- **POST**: Track view for an expose
- **GET**: Retrieve metrics for specific exposes

#### Enhanced Expose API

- **GET**: Include comment count, view count in response
- **POST**: Initialize metrics fields for new exposes

### 3. Frontend Components

#### CommentSection Component

```typescript
interface CommentSectionProps {
  exposeId: string;
  initialCommentCount: number;
  onCommentCountChange: (count: number) => void;
}
```

#### CommentForm Component

```typescript
interface CommentFormProps {
  exposeId: string;
  onCommentSubmit: (comment: IComment) => void;
}
```

#### MetricsDisplay Component

```typescript
interface MetricsDisplayProps {
  views: number;
  comments: number;
  upvotes: number;
  downvotes: number;
  shares: number;
}
```

#### Enhanced ExposeCard Component

- Integrate comment section
- Add view tracking on mount
- Display comprehensive metrics
- Improved error handling

## Data Models

### Comment Schema

```typescript
const CommentSchema = new Schema(
  {
    commentId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    },
    exposeId: {
      type: String,
      required: true,
      ref: "Expose",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    anonymousId: {
      type: String,
      required: true,
    },
    ipHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "comments",
  }
);
```

### View Tracking Schema

```typescript
const ViewTrackingSchema = new Schema(
  {
    exposeId: {
      type: String,
      required: true,
      ref: "Expose",
    },
    sessionId: {
      type: String,
      required: true,
    },
    ipHash: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "viewTracking",
  }
);
```

### Database Indexes

```typescript
// Comments indexes
CommentSchema.index({ exposeId: 1, createdAt: -1 });
CommentSchema.index({ anonymousId: 1 });

// View tracking indexes
ViewTrackingSchema.index({ exposeId: 1 });
ViewTrackingSchema.index({ sessionId: 1, exposeId: 1 }, { unique: true });
ViewTrackingSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// Enhanced expose indexes
ExposeSchema.index({ views: -1 });
ExposeSchema.index({ commentCount: -1 });
```

## Error Handling

### Frontend Error Handling

1. **Component Error Boundaries**: Wrap comment sections and metrics displays
2. **API Error Handling**: Graceful degradation when services are unavailable
3. **Validation Feedback**: Real-time validation for comment forms
4. **Network Error Recovery**: Retry mechanisms for failed requests

### Backend Error Handling

1. **Input Validation**: Comprehensive validation for all API endpoints
2. **Database Error Handling**: Proper error responses for database failures
3. **Rate Limiting**: Prevent spam and abuse
4. **Logging**: Structured logging for debugging and monitoring

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

## Testing Strategy

### Unit Tests

1. **Comment Model Tests**: Validation, creation, and retrieval
2. **View Tracking Tests**: Duplicate prevention and metrics calculation
3. **API Endpoint Tests**: Request/response validation and error handling
4. **Component Tests**: Comment form submission and display

### Integration Tests

1. **Comment Flow Tests**: End-to-end comment creation and display
2. **Metrics Tracking Tests**: View counting and metrics aggregation
3. **Database Integration Tests**: Model relationships and data consistency

### Performance Tests

1. **Load Testing**: Comment submission under high load
2. **Database Performance**: Query optimization for metrics and comments
3. **Frontend Performance**: Component rendering with large datasets

## Security Considerations

### Anonymous User Protection

1. **IP Hashing**: Store hashed IP addresses for spam prevention
2. **Rate Limiting**: Prevent comment spam from single sources
3. **Content Filtering**: Basic profanity and spam detection
4. **Session Management**: Generate secure session IDs for view tracking

### Data Privacy

1. **Anonymous Identifiers**: Generate consistent but non-traceable user IDs
2. **Data Retention**: Implement TTL for view tracking data
3. **Input Sanitization**: Prevent XSS and injection attacks
4. **CORS Configuration**: Proper cross-origin request handling

## Performance Optimizations

### Database Optimizations

1. **Aggregation Pipelines**: Efficient metrics calculation
2. **Compound Indexes**: Optimized queries for comments and views
3. **Connection Pooling**: Efficient database connection management
4. **Query Optimization**: Minimize database round trips

### Frontend Optimizations

1. **Lazy Loading**: Load comments on demand
2. **Optimistic Updates**: Immediate UI feedback for user actions
3. **Caching**: Cache comment counts and metrics
4. **Pagination**: Efficient loading of large comment lists

### API Optimizations

1. **Response Compression**: Reduce payload sizes
2. **Batch Operations**: Group related database operations
3. **Caching Headers**: Appropriate cache control for static data
4. **Request Debouncing**: Prevent duplicate API calls

## Implementation Phases

### Phase 1: Error Resolution and Code Cleanup

- Remove unused imports and variables
- Fix TypeScript warnings
- Improve error handling in existing components
- Add proper loading states

### Phase 2: Comment System Foundation

- Create comment data model and API endpoints
- Implement basic comment display and submission
- Add comment count tracking
- Integrate with existing expose display

### Phase 3: Metrics and View Tracking

- Implement view tracking system
- Add metrics display to expose cards
- Create metrics aggregation endpoints
- Optimize database queries for performance

### Phase 4: User Experience Enhancements

- Improve animations and transitions
- Add real-time updates for metrics
- Implement comment pagination
- Enhance mobile responsiveness

## Monitoring and Analytics

### Application Metrics

1. **Comment Engagement**: Track comment submission rates
2. **View Patterns**: Analyze popular content and engagement
3. **Error Rates**: Monitor API and component error frequencies
4. **Performance Metrics**: Track response times and load performance

### Database Monitoring

1. **Query Performance**: Monitor slow queries and optimization opportunities
2. **Storage Usage**: Track data growth and cleanup effectiveness
3. **Connection Health**: Monitor database connection stability
4. **Index Usage**: Ensure optimal index utilization

## Deployment Considerations

### Database Migrations

1. **Schema Updates**: Add new fields to existing expose documents
2. **Index Creation**: Create new indexes for comments and views
3. **Data Backups**: Ensure proper backup before schema changes
4. **Rollback Strategy**: Plan for reverting changes if needed

### API Versioning

1. **Backward Compatibility**: Maintain existing API contracts
2. **Gradual Rollout**: Phase deployment of new endpoints
3. **Feature Flags**: Control feature availability during deployment
4. **Health Checks**: Monitor system health during deployment
