(function () {
  window.StorageAPI = {
    _keyUsers: 'va_users',
    _keyEvents: 'va_events',
    _keyNotifs: 'va_notifications',

    // Helpers
    _load(key) {
      try {
        return JSON.parse(localStorage.getItem(key) || 'null') || [];
      } catch (e) {
        return [];
      }
    },
    _save(key, data) {
      localStorage.setItem(key, JSON.stringify(data || []));
    },

    // Users
    getUsers() { return this._load(this._keyUsers); },
    saveUsers(users) { this._save(this._keyUsers, users); },

    findUser(email) {
      if (!email) return null;
      return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    addUser(user) {
      const users = this.getUsers();
      users.push(user);
      this.saveUsers(users);
      return user;
    },

    updateUser(email, patch) {
      const users = this.getUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) return null;
      users[idx] = Object.assign({}, users[idx], patch);
      this.saveUsers(users);
      return users[idx];
    },

    // Events
    getEvents() { return this._load(this._keyEvents); },
    saveEvents(evts) { this._save(this._keyEvents, evts); },
    addEvent(evt) {
      const evts = this.getEvents();
      evt.id = 'evt_' + Date.now();
      evts.push(evt);
      this.saveEvents(evts);
      return evt;
    },
    updateEvent(id, patch) {
      const evts = this.getEvents();
      const idx = evts.findIndex(e => e.id === id);
      if (idx === -1) return null;
      evts[idx] = Object.assign({}, evts[idx], patch);
      this.saveEvents(evts);
      return evts[idx];
    },

    // Notifications
    getNotifications() { return this._load(this._keyNotifs); },
    saveNotifications(n) { this._save(this._keyNotifs, n); },
    addNotification(n) {
      const nots = this.getNotifications();
      n.id = 'n_' + Date.now();
      n.createdAt = new Date().toISOString();
      n.read = n.read || false;
      nots.push(n);
      this.saveNotifications(nots);
      return n;
    },
    markNotificationRead(id) {
      const nots = this.getNotifications();
      const idx = nots.findIndex(x => x.id === id);
      if (idx === -1) return null;
      nots[idx].read = true;
      this.saveNotifications(nots);
      return nots[idx];
    }
  };

  // Create a default admin for demo if no users exist
  (function ensureDemoAdmin() {
    const users = StorageAPI.getUsers();
    if (!users || users.length === 0) {
      const admin = {
        email: 'testadmin@gmail.com',
        password: 'adminadmin', // demo only – in production DO NOT store plaintext passwords
        name: 'Administrator',
        google: false,
        role: 'admin',
        profile: null
      };
      StorageAPI.addUser(admin);
      console.info('Demo admin created: admin@demo.com / Admin1234!');
    }
  })();

})();
