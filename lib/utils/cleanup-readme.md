# Expose Corner Cleanup System

## Overview

The cleanup system automatically removes expired exposes and their associated files to maintain privacy and system performance.

## Components

### 1. Database TTL Index

- MongoDB automatically deletes expired documents using TTL (Time To Live) index
- Set on `expiresAt` field with `expireAfterSeconds: 0`
- Runs approximately every 60 seconds

### 2. Scheduled Cleanup Job

- Node.js cron job runs every hour
- Cleans up files associated with expired exposes
- Backup job runs every 6 hours

### 3. Manual Cleanup API

- `POST /api/expose/cleanup` - Manual cleanup trigger
- `GET /api/expose/cleanup` - Check expired exposes
- `GET /api/expose/cleanup?test=true` - Test mode

### 4. Test Cleanup System

- `POST /api/expose/test-cleanup` - Test with shorter expiration
- `GET /api/expose/test-cleanup` - Get cleanup statistics

## Configuration

### Environment Variables

- `ENABLE_CLEANUP_SCHEDULER=true` - Enable in development
- Automatically enabled in production

### Expiration Settings

- Default: 4 days from creation
- Configurable in the database model

## Usage

### Production

Cleanup runs automatically when the application starts.

### Development

```bash
# Enable cleanup scheduler
export ENABLE_CLEANUP_SCHEDULER=true

# Or set in .env.local
ENABLE_CLEANUP_SCHEDULER=true
```

### Testing

```bash
# Check cleanup statistics
curl http://localhost:3000/api/expose/test-cleanup

# Run test cleanup (expires content in 1 minute)
curl -X POST http://localhost:3000/api/expose/test-cleanup \
  -H "Content-Type: application/json" \
  -d '{"testExpirationMinutes": 1}'

# Manual cleanup
curl -X POST http://localhost:3000/api/expose/cleanup
```

## File Cleanup Process

1. Find expired exposes in database
2. Extract file URLs (images and audio)
3. Delete files from filesystem
4. Remove database records
5. Log cleanup results

## Error Handling

- File cleanup failures don't prevent database cleanup
- Individual file errors are logged but don't stop the process
- Database operations are wrapped in try-catch blocks
- Cleanup continues even if some operations fail

## Monitoring

The system logs:

- Cleanup job start/completion
- Number of exposes cleaned
- Number of files deleted
- Any errors encountered

## Security

- Only expired content is cleaned up
- File paths are validated to prevent directory traversal
- Cleanup operations are atomic where possible
- No user data is logged during cleanup
