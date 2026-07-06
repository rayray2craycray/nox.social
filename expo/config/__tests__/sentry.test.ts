jest.mock('@sentry/browser', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = { setExtras: jest.fn() };
    callback(scope);
    return scope;
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Helper: re-require both sentry config AND the mock so they share the same reference
function freshSentry() {
  jest.resetModules();
  const SentryMock = require('@sentry/browser');
  const sentryConfig = require('../sentry');
  return { SentryMock, sentryConfig };
}

describe('Sentry Configuration', () => {
  describe('initSentry', () => {
    it('should call Sentry.init', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.initSentry();
      expect(SentryMock.init).toHaveBeenCalledTimes(1);
    });

    it('should only initialize once', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.initSentry();
      sentryConfig.initSentry();
      expect(SentryMock.init).toHaveBeenCalledTimes(1);
    });

    it('should not throw if Sentry.init fails', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      SentryMock.init.mockImplementationOnce(() => {
        throw new Error('Init failed');
      });
      expect(() => sentryConfig.initSentry()).not.toThrow();
    });

    it('should pass configuration to Sentry.init', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.initSentry();
      expect(SentryMock.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: expect.any(String),
          tracesSampleRate: 0.2,
          environment: expect.any(String),
        })
      );
    });
  });

  describe('captureException', () => {
    it('should call Sentry.captureException via withScope', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      const error = new Error('Test error');
      sentryConfig.captureException(error);
      expect(SentryMock.withScope).toHaveBeenCalled();
      expect(SentryMock.captureException).toHaveBeenCalledWith(error);
    });

    it('should not throw if withScope fails', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      SentryMock.withScope.mockImplementationOnce(() => {
        throw new Error('Scope failed');
      });
      expect(() => sentryConfig.captureException(new Error('Test'))).not.toThrow();
    });
  });

  describe('captureMessage', () => {
    it('should call Sentry.captureMessage with default level', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.captureMessage('Test message');
      expect(SentryMock.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should call Sentry.captureMessage with specified level', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.captureMessage('Warning!', 'warning');
      expect(SentryMock.captureMessage).toHaveBeenCalledWith('Warning!', 'warning');
    });

    it('should not throw if captureMessage fails', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      SentryMock.captureMessage.mockImplementationOnce(() => {
        throw new Error('Capture failed');
      });
      expect(() => sentryConfig.captureMessage('Test')).not.toThrow();
    });
  });

  describe('setUser', () => {
    it('should call Sentry.setUser with user data', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.setUser({ id: 'user-1', email: 'test@example.com' });
      expect(SentryMock.setUser).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'test@example.com',
      });
    });

    it('should not throw if setUser fails', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      SentryMock.setUser.mockImplementationOnce(() => {
        throw new Error('Failed');
      });
      expect(() => sentryConfig.setUser({ id: '1' })).not.toThrow();
    });
  });

  describe('clearUser', () => {
    it('should call Sentry.setUser with null', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.clearUser();
      expect(SentryMock.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('setUserContext (legacy)', () => {
    it('should set user when userId is provided', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.setUserContext('user-1', 'test@example.com', 'testuser');
      expect(SentryMock.setUser).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should clear user when userId is null', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.setUserContext(null);
      expect(SentryMock.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should call Sentry.addBreadcrumb', () => {
      const { SentryMock, sentryConfig } = freshSentry();
      sentryConfig.addBreadcrumb('User clicked', 'ui', { button: 'submit' });
      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked',
        category: 'ui',
        data: { button: 'submit' },
        level: 'info',
      });
    });
  });
});
