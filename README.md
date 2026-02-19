# GoEasy Backend 
#### This repository contains the backend API for GoEasy, a cheap travel activity planning tool designed for budget travelers. The backend manages authentication and relational trip data

Live Site: https://goeasy-travel.vercel.app/
Frontend Repo: https://github.com/magali-la/goeasy-app 

## Tech Stack
The backend is built with Node.js and Express, using MongoDB as the database and Mongoose as the ODM.

**Language**
- JavaScript

**Run-time & Library**
- Node.js
- Express.js

**ODM**
- Mongoose

**Database**
- MongoDB

**Authentication**
- OAuth 2.0
- Passport.js
- Bcrypt
- JWT 

**Testing**
- Postman (manual API testing)

## Architecture Considertions
### User Management / Authentication
**Username validation tradeoffs**
- Server-side max length: 30 (to handle long email prefixes from OAuth users)
- Frontend max length: 15 (for local signups)
- Minimum length is set to 1 to avoid OAuth edge cases for email lengths and allow flexibility when more providers are added, but frontend will enforce a min length of 6 for local users.

**Password Handling**
- Initially used `toObject()` to convert Mongoose documents to plain objects and `delete password` in routes to protect the password in responses to the client
- Refactored to `select: false` in schema to avoid repeated code 
- Used `select("+password")` for login route for bcrypt comparison

**Authentication Error Handling**
- Login responses intentionally return a generic error message for users not found by email or incorrect password for security reasons

**Future Scalability**
- Currently, only Google OAuth is implemented. OAuth routes are orgnized in the `routes/auth` folder with `routes/auth/index.js` serving as an extensible hub. This allows for easy addition of other OAuth providers in the future

### Selective Population Strategy
Because the UI required nested and relational data (users → trips → activities → participants), I intentionally designed the schemas using references instead of embedding large objects. This allowed the backend to stay flexible and avoid duplicating data across collections.

I used Mongoose `populate()` to selectively retrieve data based on what the frontend actually needed.

**User Overview Screens (Dashboard / Trips):** 
- The frontend calls `GET /api/users/me` and the backend returns a profile that already includes populated `trips` and populated activity objects within `activities.activityIds`
- This makes it easy for the UI to compute planned spending: a feature which sums activity prices within a specific trip without making extra requests per trip

**Trip Detail Screen:**
- The frontend calls `GET /api/trips/:tripId` to perform an authorization check first (the user must be a trip participant), then populates deeper trip-specific data such as `participants` and the full activity objects inside `trip.activities.activityId` to display in cards
- This design allows for future scalability, where users can in the future add trip participants

**Avoiding Unnecessary Population:** 
- Routes that are focused on a single update (ex: editing trip fields, adding/removing an activity) don’t need to deeply populate every nested object
- When a fully populated view is needed for display, the frontend follows up with a GET request (ex: after updating a trip, TripDetail refreshes the trip via `GET /api/trips/:tripId` to ensure activity data is fully populated)

This approach balances performance and flexibility: lightweight routes stay fast, while UI-heavy pages receive richer, pre-joined responses only when needed.

## Key Learnings
**Regex Validation Edge Cases**
- I ran into an issue with my username regex pattern when attempting to add a period as an accepted character to stay flexible for OAuth users whose emails are used for usernames
- My validation was not working, because I added a period after the dash `-`. I learned that a dash `-`, must be at the beginning or end of a regex pattern so that it won't be unintentionally interpreted as a range
- This experience allowed me to understand how order matters with regex character classes

**Strategic Use of `populate()` Method**
- Using Mongoose’s `populate()` became a key part of the backend design. I learned how to model relationships using references and selectively populate only when needed
- I also learned the importance of performing authorization checks before populating data to avoid unnecessary database work. This improved both performance and code clarity

## API Routes
### User Routes
<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Request Body</th>
      <th>Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/users/signup</code></td>
      <td><code>POST</code></td>
      <td>Create a new local user</td>
      <td><code>{ username, email, password }</code></td>
      <td><code>{ user: { _id, username, email, createdAt, updatedAt } }</code></td>
    </tr>
    <tr>
      <td><code>/api/users/login</code></td>
      <td><code>POST</code></td>
      <td>Login existing user and return JWT</td>
      <td><code>{ email, password }</code></td>
      <td><code>{ token, user: { _id, username, email } }</code></td>
    </tr>
    <tr>
      <td><code>/api/users/me</code></td>
      <td><code>GET</code></td>
      <td>Get current authenticated user's info with populated trips, activities, and budget data</td>
      <td><code>JWT in header</code></td>
      <td><code>{ _id, username, email, trips: [...], activities: [...], budgets: [...], createdAt, updatedAt}</code></td>
    </tr>
  </tbody>
</table>

### Trip Routes
<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Request Body</th>
      <th>Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/trips</code></td>
      <td><code>GET</code></td>
      <td>Get all trips for authenticated user</td>
      <td><code>JWT in header</code></td>
      <td><code>[ { _id, title, description, city, startDate, endDate, status, participants, activities } ]</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId</code></td>
      <td><code>GET</code></td>
      <td>Get a single trip (must be a participant)</td>
      <td><code>JWT in header</code></td>
      <td><code>{ _id, title, description, city, participants, activities }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips</code></td>
      <td><code>POST</code></td>
      <td>Create a new trip</td>
      <td><code>{ title, description, city, startDate, endDate, status, participants }</code></td>
      <td><code>{ _id, title, description, city, participants }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId</code></td>
      <td><code>PUT</code></td>
      <td>Update a trip (must be a participant)</td>
      <td><code>{ updated fields }</code></td>
      <td><code>{ updatedTrip }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId</code></td>
      <td><code>DELETE</code></td>
      <td>Delete a trip (must be a participant)</td>
      <td><code>JWT in header</code></td>
      <td><code>{ message, deletedTrip }</code></td>
    </tr>
  </tbody>
</table>

### Trip Participant Routes
<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Request Body</th>
      <th>Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/trips/:tripId/participants</code></td>
      <td><code>POST</code></td>
      <td>Add a participant to a trip</td>
      <td><code>{ userId }</code></td>
      <td><code>{ updatedTrip }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId/participants/:userId</code></td>
      <td><code>DELETE</code></td>
      <td>Remove a participant from a trip</td>
      <td><code>JWT in header</code></td>
      <td><code>{ updatedTrip }</code></td>
    </tr>
  </tbody>
</table>

### Trip Activity Routes
<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Request Body</th>
      <th>Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/trips/:tripId/activities</code></td>
      <td><code>POST</code></td>
      <td>Add an activity to a trip</td>
      <td><code>{ activityId, participants }</code></td>
      <td><code>{ trip }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId/activities/:activityId</code></td>
      <td><code>DELETE</code></td>
      <td>Remove an activity from a trip</td>
      <td><code>JWT in header</code></td>
      <td><code>{ message, trip }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId/activities/:activityId/participants</code></td>
      <td><code>POST</code></td>
      <td>Add a participant to an activity</td>
      <td><code>{ userId }</code></td>
      <td><code>{ user, message }</code></td>
    </tr>
    <tr>
      <td><code>/api/trips/:tripId/activities/:activityId/participants/:userId</code></td>
      <td><code>DELETE</code></td>
      <td>Remove a participant from an activity</td>
      <td><code>JWT in header</code></td>
      <td><code>{ user, message }</code></td>
    </tr>
  </tbody>
</table>

### Activity Routes (City Data)
<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Request Body</th>
      <th>Response</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/api/activities/city/:cityId</code></td>
      <td><code>GET</code></td>
      <td>Get all activities for a specific city</td>
      <td><code>JWT in header</code></td>
      <td><code>[ { _id, title, description, location, city, price, imageUrl, tags } ]</code></td>
    </tr>
    <tr>
      <td><code>/api/activities/:activityId</code></td>
      <td><code>GET</code></td>
      <td>Get a single activity by ID</td>
      <td><code>JWT in header</code></td>
      <td><code>{ _id, title, description, location, city, price, imageUrl, tags }</code></td>
    </tr>
  </tbody>
</table>