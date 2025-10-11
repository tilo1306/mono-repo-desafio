jest.setTimeout(30000);

beforeAll(async () => {
  // Database connection will be handled by TestAppModule
  console.log('E2E test setup completed');
});

afterAll(async () => {
  // Cleanup will be handled by TestAppModule
});
