// routes/profile.js

const states = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

const skills = ["CPR", "Teaching", "First Aid", "Cooking", "Driving", "Cleaning"];

// Helper to read users from mocked localStorage
function getUsers() {
  const usersJSON = global.localStorage?.getItem('users');
  return usersJSON ? JSON.parse(usersJSON) : [];
}

// Helper to write users to mocked localStorage
function setUsers(users) {
  if (global.localStorage) global.localStorage.setItem('users', JSON.stringify(users));
}

const ProfileAPI = {
  getStates: () => states,
  getSkills: () => skills,
  getCurrentUser: () => {
    const currentUserJSON = global.localStorage?.getItem('currentUser');
    return currentUserJSON ? JSON.parse(currentUserJSON) : null;
  },
  getUserProfile: (email) => {
    const users = getUsers();
    return users.find(u => u.email === email) || null;
  },
  updateUserProfile: (email, newProfile) => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return false;
    if (newProfile.fullName) {
      user.name = newProfile.fullName;
      user.profile.fullName = newProfile.fullName;
    }
    if (newProfile.availability) user.profile.availability = newProfile.availability;
    setUsers(users);
    return true;
  },
  addAvailability: (email, date) => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return [];
    if (!user.profile.availability.includes(date)) user.profile.availability.push(date);
    setUsers(users);
    return user.profile.availability;
  },
  removeAvailability: (email, date) => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return [];
    user.profile.availability = user.profile.availability.filter(d => d !== date);
    setUsers(users);
    return user.profile.availability;
  }
};

module.exports = { ProfileAPI };
