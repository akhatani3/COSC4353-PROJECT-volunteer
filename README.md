# COSC4353-PROJECT-volunteer
#  How to start the volunteer Project Demo?
- Download the entire project as a ZIP and extract it.
- Open the project folder in Visual Studio.
- Open terminal in VStudio and run: rm -rf node_modules package-lock.json && npm install (only for the first time)
- Run: npm install pdfkit csv-writer (only for the first time)
- Run: node server.js (every time you need to start the server)
- Copy the localhost IP address (Ex, http://localhost:3000 ) and paste it into the browser.

# 1. Login Page
Purpose: Allows volunteers and administrators to securely access the system.


Features:
Email and password fields with validation (email format check, password length).
“Show password” toggle for convenience.
“Forgot password?” link (stubbed for demo).
Link to the registration page for new users.
Design: Simple, card-based form consistent with the rest of the app. Validation errors are shown inline.
Functionality: On successful login, the system redirects the user to their profile page.
# 2. Registration Page
Purpose: Enables new users (volunteers or admins) to create an account.


Features:
Email (username) and password fields.
Confirm password field with validation to ensure passwords match.
“Show passwords” checkbox.
Link to the login page for users who already have accounts.


Validations:
Email format check.
Password required, at least 8 characters long.
Confirm password must match.


Functionality: On success, the user is redirected to the profile page to complete additional details.
# 3. User Profile Page
Purpose: Volunteers complete or update their personal details after registration.


Fields included:
Full Name (required, 50 chars)
Address 1 (required, 100 chars), Address 2 (optional, 100 chars)
City (required, 100 chars)
State (dropdown, required, stores 2-character code)
Zip Code (required, up to 9 chars, at least 5)
Skills (multi-select dropdown, required)
Preferences (optional text area)
Availability (date picker, multiple dates allowed, required)


Validations: Ensures required fields are filled, character limits respected, and correct data formats entered.


Functionality:
Save button updates stored data.
Logout button clears user data and returns to login.


Design: Consistent card layout with clear labels and error handling.

# 4. Event Management Page (Admin Only)

Purpose: Administrators can create and manage events.


Fields included:
Event Name (required, 100 chars)
Event Description (required, textarea)
Location (required, textarea)
Required Skills (multi-select dropdown, required)
Urgency (dropdown: Low, Medium, High, required)
Event Date (calendar date picker, required)


Validations: Required fields enforced, character limits checked.


Functionality: Admins can save event details into the system (for demo stored in localStorage). These events will later appear in volunteer matching and history pages.
# 5. Volunteer Matching Form (Admin Only)
Purpose: Helps administrators assign volunteers to events based on their profiles.


Features:
Volunteer Name (auto-filled from registered users).
Matched Event (auto-suggested based on volunteer’s skills and availability).
Manual override possible by selecting another event.


Functionality:
Admin can confirm matches, which triggers a notification for the volunteer.
For the demo version, matching is simplified using basic checks (skills and availability) from localStorage.


# 6. Notification System
Purpose: Keeps volunteers updated on assignments, reminders, and event changes.


Features:
Notifications appear as banners, popups, or a sidebar panel.
Examples: “You’ve been assigned to Event A”, “Reminder: Event B tomorrow”.


Functionality:
In the demo, notifications are generated and stored in localStorage.
In a full system, notifications could be delivered via email, SMS, or in-app alerts.
# 7. Volunteer History Page
Purpose: Allows volunteers and administrators to review past participation.


Features:
Table view listing past events with key details:
Event Name, Date, Location
Required Skills
Urgency
Participation Status (e.g., Attended, Missed, Declined)


Functionality:
Data is drawn from event records and the volunteer’s profile.
Enables volunteers to track hours and contributions, and helps admins monitor engagement.


Design: Tabular layout for clarity, with consistent styling to match other pages.

Data Base:
Utilizing Mongo DB to store events, events names, details, priority, volunteers in each event, events for each volunteer, adminstrators profiles, and user profiles (email, name, address, zip code, state, and registered events).
