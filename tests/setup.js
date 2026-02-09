// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

// Mock crypto.randomUUID - jsdom's crypto doesn't have randomUUID
Object.defineProperty(global.crypto, "randomUUID", {
  value: () => "test-uuid-" + Math.random().toString(36).substring(2, 11),
  writable: true,
  configurable: true,
});
