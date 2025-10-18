const express = require('express');
const router = express.Router();

// example endpoint
router.get('/:email', (req, res) => {
  res.json({ message: 'Profile route works!' });
});

module.exports = router; // <- export the router itself

const ProfileAPI = (() => {
    // States as objects
    const STATES = [
      {code:'AL',name:'Alabama'},{code:'AK',name:'Alaska'},{code:'AZ',name:'Arizona'},
      {code:'AR',name:'Arkansas'},{code:'CA',name:'California'},{code:'CO',name:'Colorado'},
      {code:'CT',name:'Connecticut'},{code:'DE',name:'Delaware'},{code:'FL',name:'Florida'},
      {code:'GA',name:'Georgia'},{code:'HI',name:'Hawaii'},{code:'ID',name:'Idaho'},
      {code:'IL',name:'Illinois'},{code:'IN',name:'Indiana'},{code:'IA',name:'Iowa'},
      {code:'KS',name:'Kansas'},{code:'KY',name:'Kentucky'},{code:'LA',name:'Louisiana'},
      {code:'ME',name:'Maine'},{code:'MD',name:'Maryland'},{code:'MA',name:'Massachusetts'},
      {code:'MI',name:'Michigan'},{code:'MN',name:'Minnesota'},{code:'MS',name:'Mississippi'},
      {code:'MO',name:'Missouri'},{code:'MT',name:'Montana'},{code:'NE',name:'Nebraska'},
      {code:'NV',name:'Nevada'},{code:'NH',name:'New Hampshire'},{code:'NJ',name:'New Jersey'},
      {code:'NM',name:'New Mexico'},{code:'NY',name:'New York'},{code:'NC',name:'North Carolina'},
      {code:'ND',name:'North Dakota'},{code:'OH',name:'Ohio'},{code:'OK',name:'Oklahoma'},
      {code:'OR',name:'Oregon'},{code:'PA',name:'Pennsylvania'},{code:'RI',name:'Rhode Island'},
      {code:'SC',name:'South Carolina'},{code:'SD',name:'South Dakota'},{code:'TN',name:'Tennessee'},
      {code:'TX',name:'Texas'},{code:'UT',name:'Utah'},{code:'VT',name:'Vermont'},
      {code:'VA',name:'Virginia'},{code:'WA',name:'Washington'},{code:'WV',name:'West Virginia'},
      {code:'WI',name:'Wisconsin'},{code:'WY',name:'Wyoming'}
    ];
  
    const SKILLS = [
      'First Aid','CPR','Food Service','Logistics','Child Care','Tutoring','Admin','Drivers','Medical','Translation'
    ];
  
    function _getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); }
    function _saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
  
    function getCurrentUser() { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
    function getStates() { return STATES; }
    function getSkills() { return SKILLS; }
  
    function getUserProfile(email) {
      const users = _getUsers();
      return users.find(u => u.email === email) || null;
    }
  
    function updateUserProfile(email, profile) {
      const users = _getUsers();
      const idx = users.findIndex(u => u.email === email);
      if (idx === -1) return false;
      users[idx].profile = profile;
      users[idx].name = profile.fullName;
      _saveUsers(users);
      return true;
    }
  
    function addAvailability(email, date) {
      const users = _getUsers();
      const idx = users.findIndex(u => u.email === email);
      if (idx === -1) return [];
      users[idx].profile = users[idx].profile || {};
      users[idx].profile.availability = users[idx].profile.availability || [];
      if (!users[idx].profile.availability.includes(date)) users[idx].profile.availability.push(date);
      _saveUsers(users);
      return [...users[idx].profile.availability];
    }
  
    function removeAvailability(email, date) {
      const users = _getUsers();
      const idx = users.findIndex(u => u.email === email);
      if (idx === -1) return [];
      users[idx].profile = users[idx].profile || {};
      users[idx].profile.availability = users[idx].profile.availability || [];
      users[idx].profile.availability = users[idx].profile.availability.filter(d => d !== date);
      _saveUsers(users);
      return [...users[idx].profile.availability];
    }
  
    return {
      getCurrentUser,
      getStates,
      getSkills,
      getUserProfile,
      updateUserProfile,
      addAvailability,
      removeAvailability
    };
  })();

  module.exports = {
    router,     // for server.js
    ProfileAPI  // for unit tests
  };
  