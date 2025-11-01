// tests/profile.test.js
const { ProfileAPI } = require('../routes/profile');

describe("ProfileAPI", () => {
  // Mock localStorage for Node
  beforeEach(() => {
    global.localStorage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, value) { this.store[key] = value.toString(); },
      removeItem(key) { delete this.store[key]; },
      clear() { this.store = {}; }
    };

    // Seed some test users
    global.localStorage.setItem('users', JSON.stringify([
      { email: 'john@example.com', name: 'John Doe', profile: { fullName: 'John Doe', availability: [] } },
      { email: 'jane@example.com', name: 'Jane Smith', profile: {} }
    ]));

    global.localStorage.setItem('currentUser', JSON.stringify({ email: 'john@example.com' }));
  });

  test("getStates returns all 50 states", () => {
    const states = ProfileAPI.getStates();
    expect(states.length).toBe(50);
    expect(states[0]).toEqual({ code: "AL", name: "Alabama" });
    expect(states[49]).toEqual({ code: "WY", name: "Wyoming" });
  });

  test("getSkills returns the skills array", () => {
    const skills = ProfileAPI.getSkills();
    expect(skills).toContain('CPR');
    expect(skills.length).toBeGreaterThan(5);
  });

  test("can get the current user", () => {
    const user = ProfileAPI.getCurrentUser();
    expect(user).toEqual({ email: 'john@example.com' });
  });

  test("can get a user profile by email", () => {
    const profile = ProfileAPI.getUserProfile('john@example.com');
    expect(profile.name).toBe('John Doe');
    expect(profile.profile.fullName).toBe('John Doe');
  });

  test("getUserProfile returns null for unknown email", () => {
    const profile = ProfileAPI.getUserProfile('unknown@example.com');
    expect(profile).toBeNull();
  });

  test("can update a user profile", () => {
    const success = ProfileAPI.updateUserProfile('john@example.com', { fullName: 'Johnny D', availability: [] });
    expect(success).toBe(true);
    const updated = ProfileAPI.getUserProfile('john@example.com');
    expect(updated.name).toBe('Johnny D');
    expect(updated.profile.fullName).toBe('Johnny D');
  });

  test("updateUserProfile returns false for unknown email", () => {
    const success = ProfileAPI.updateUserProfile('unknown@example.com', { fullName: 'No One' });
    expect(success).toBe(false);
  });

  test("can add availability date", () => {
    const dates = ProfileAPI.addAvailability('john@example.com', '2025-10-17');
    expect(dates).toContain('2025-10-17');
  });

  test("can remove availability date", () => {
    ProfileAPI.addAvailability('john@example.com', '2025-10-17');
    const dates = ProfileAPI.removeAvailability('john@example.com', '2025-10-17');
    expect(dates).not.toContain('2025-10-17');
  });
});
