# FlowAI E2E Tests

End-to-end tests for FlowAI using Playwright.

## Setup

Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

## Test Structure

```
tests/e2e/
├── auth.spec.ts           # Authentication flow tests
├── dashboard.spec.ts      # Dashboard functionality tests
├── video-studio.spec.ts   # Video generation tests
├── marketplace.spec.ts    # Marketplace and style packs tests
├── utils/
│   └── auth-setup.ts     # Authentication helpers
└── README.md             # This file
```

## Test Categories

### 🔐 Authentication (`auth.spec.ts`)
- Login/signup flows
- Form validation
- Password reset
- Email validation

### 📊 Dashboard (`dashboard.spec.ts`)
- Content generation
- Project management
- Rate limiting
- Admin panel access
- Mobile navigation

### 🎬 Video Studio (`video-studio.spec.ts`)
- Video generation
- Style selection
- Queue management
- Video player
- Remix and clip features
- Token earnings

### 🛒 Marketplace (`marketplace.spec.ts`)
- Browse items
- Search and filters
- Item details
- Purchase flow
- Creator uploads
- Earnings tracking

## Test Users

Test users are defined in `utils/auth-setup.ts`:

```typescript
TEST_USERS = {
  regular: { email: 'test@flowai.com', password: '...' },
  admin: { email: 'admin@flowai.com', password: '...' }
}
```

⚠️ **Note**: You need to create these users in your test database before running authenticated tests.

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:8080`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Screenshots: On failure
- Videos: Retained on failure
- Traces: On first retry

## Writing New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Import test utilities:
```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './utils/auth-setup';
```

3. Structure your tests:
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## CI/CD Integration

Tests automatically run in CI with:
- Retries: 2
- Workers: 1 (no parallelization)
- Reporter: HTML
- Screenshots and videos on failure

## Debugging Failed Tests

1. View test report:
```bash
npx playwright show-report
```

2. View traces:
```bash
npx playwright show-trace trace.zip
```

3. Use Playwright Inspector:
```bash
npx playwright test --debug
```

## Best Practices

1. ✅ Use semantic selectors (role, text, label)
2. ✅ Add explicit waits for dynamic content
3. ✅ Test mobile responsiveness
4. ✅ Skip tests requiring real data with `test.skip()`
5. ✅ Use helper functions for common actions
6. ❌ Don't use fragile CSS selectors
7. ❌ Don't hardcode long timeouts
8. ❌ Don't test external services

## Coverage Goals

- [x] Authentication: 80% coverage
- [ ] Dashboard: 60% coverage (requires auth setup)
- [ ] Video Studio: 40% coverage (requires auth setup)
- [ ] Marketplace: 40% coverage (requires auth setup)

## Known Issues

- Some tests are skipped (`test.skip()`) because they require:
  - Valid test user credentials
  - Database seeding
  - Backend API running

To enable these tests:
1. Set up test database
2. Create test users
3. Update `TEST_USERS` in `auth-setup.ts`
4. Remove `test.skip()` calls

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
