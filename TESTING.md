# SmartPlaylist Testing Documentation

## Overview

This document outlines testing approaches, methodologies, and known issues for the SmartPlaylist application, with special focus on the playlist export functionality.

## Test Environment Setup

### Prerequisites
- Node.js (v16+)
- Local Supabase instance or test project
- Spotify Developer account with API credentials
- YouTube API credentials

### Environment Configuration
```
# .env.test example
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_supabase_key
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

## Test Categories

### 1. Unit Tests

Unit tests focus on isolated components and functions:

- Track matching algorithms
- Text normalization functions
- Similarity calculation functions

#### Running Unit Tests
```bash
npm run test:unit
```

### 2. Integration Tests

Integration tests verify interactions between modules:

- Playlist creation and song association
- Export service integration with Spotify/YouTube APIs
- Authentication flows

#### Running Integration Tests
```bash
npm run test:integration
```

### 3. End-to-End Tests

E2E tests simulate real user workflows:

- Complete playlist generation process
- Export to different platforms
- User authentication and authorization

#### Running E2E Tests
```bash
npm run test:e2e
```

## Testing Focus Areas

### Playlist Export Functionality

#### Spotify Export Testing

The Spotify export functionality requires thorough testing due to its complex matching algorithm:

1. **Search Strategy Testing**
   - Test multiple search attempts with varying query formats
   - Verify that increasing search results from 20 to 30 improves match rates
   - Test partial title matching using first 3 words
   - Test artist keyword search using first word of artist name

2. **Match Algorithm Testing**
   - Test title similarity thresholds (currently 0.85)
   - Test artist similarity thresholds (currently 0.75)
   - Test combined weighted scores against minimum similarity (0.6, 0.5, 0.4)
   - Verify title length difference tolerance (25 characters)

3. **Song Batch Processing**
   - Verify songs are processed in batches of 50 (Spotify API limit)
   - Test adding tracks to playlist with various batch sizes

4. **Match Rate Verification**
   - Test export with match rates above threshold (40%)
   - Test export with match rates below threshold (< 40%)
   - Verify match rate statistics are correctly calculated

#### YouTube Export Testing

1. **Search Query Testing**
   - Test search queries with "official music video" suffix
   - Verify top result selection logic

2. **YouTube Playlist Creation**
   - Test public/private playlist settings
   - Verify description sanitization

### Known Issues and Testing Workarounds

#### Spotify Export Limitations

1. **Inconsistent Match Rates**
   - **Issue**: Even with optimized parameters, match rates can vary between 50-90% depending on music genre and song metadata quality.
   - **Testing**: Use standardized test datasets for different genres to establish baseline expectations.

2. **Export Size Discrepancy**
   - **Issue**: Generated playlists of 20 songs may only export 10-15 songs to Spotify due to matching limitations.
   - **Testing**: Create test cases with highly recognizable popular songs to establish maximum possible match rate.
   - **Workaround**: Consider implementing fallback search strategies or user-guided matching for important tracks.

3. **Genre-Specific Matching Challenges**
   - **Issue**: Certain genres (classical, jazz, electronic) have worse match rates due to naming conventions and variations.
   - **Testing**: Maintain separate test suites for problematic genres with adjusted expectations.

#### YouTube Export Limitations

1. **Video Selection Quality**
   - **Issue**: Selected videos may not be official or may be covers/remixes.
   - **Testing**: Manual verification of selected videos against expected results.

## Performance Testing

### Export Time Benchmarks

Expected performance metrics:
- Small playlists (10 songs): < 15 seconds
- Medium playlists (20 songs): 15-30 seconds
- Large playlists (50+ songs): 30-90 seconds

### Load Testing

Test concurrent exports with:
- 5 simultaneous users
- 10 simultaneous users
- 20 simultaneous users

## Test Data

### Test Playlists

Create the following standardized test playlists:

1. **Popular Hits** - Mainstream high-recognition songs
2. **Indie Mix** - Lesser-known independent artists
3. **Classical Collection** - Classical pieces with complex naming
4. **Electronic/EDM** - Songs with remixes and variations
5. **International Music** - Non-English songs to test localization

## Test Case Documentation

### Template for Test Cases

```
Test ID: TC-001
Title: Export 20-song playlist to Spotify
Description: Tests the export of a standard 20-song playlist to Spotify
Prerequisites: 
  - Authenticated user
  - Valid Spotify connection
  - Playlist with 20 songs exists
Steps:
  1. Navigate to playlist page
  2. Click export button
  3. Select Spotify as export platform
  4. Confirm export
Expected Results:
  - Export completion message
  - Spotify playlist created
  - At least 16/20 songs (80%) matched
  - Match rate statistics displayed
```

## Regression Testing

After any changes to the matching algorithm or export service, run the following regression tests:

1. Export standard test playlists to verify match rates haven't decreased
2. Verify error handling for edge cases
3. Test with previously problematic songs that have been fixed

## Continuous Integration

Configure CI pipeline to:
- Run unit and integration tests on each PR
- Generate test coverage reports
- Perform E2E tests on staging environment before production deployment

## Bug Reporting

When reporting export-related bugs, include:
- Complete playlist data (songs, artists, albums)
- Export logs showing search attempts
- Match rate statistics
- Expected vs. actual results

## Future Test Improvements

1. Implement automated match quality assessment
2. Create larger test datasets covering more music genres
3. Develop visual regression testing for UI components
4. Implement API mocking for faster test execution 