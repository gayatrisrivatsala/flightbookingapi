Flight Booking API

This is a backend API for flight booking with user authentication, flight search, booking, and cancellation.

Features

- User can sign up and log in.
- Login returns a JWT token (expires in 30 minutes).
- Users can view all flights.
- Flights can be searched by origin and destination.
- Results are paginated (e.g. ?page=1&limit=5).
- Authenticated users can book a seat on a flight.
- Bookings reduce available seats by 1.
- Users can cancel their bookings.
- Cancelling a booking increases available seats by 1.
- Users can view their booking history.

Data

All data is stored in memory (arrays). No database is used.

Setup Instructions

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root folder with:
   JWT_SECRET= placeyourindividualtokenhere
4. Run `npm run dev` to start the server.
5. Server runs on http://localhost:3000

API Endpoints

POST /users/signup
  Register a new user. Requires name, email, password.

POST /users/login
  Log in with email and password. Returns JWT token.

GET /flights
  Returns list of flights.
  Supports:
    ?page=1&limit=5 for pagination
    ?origin=BLR&dest=DEL for search

POST /bookings
  Book a flight. Requires JWT in Authorization header.
  Input: { "flightId": 1 }

POST /bookings/:id/cancel
  Cancel a booking by ID. Requires JWT.

GET /bookings/:userId
  View all bookings for a user. Requires JWT.

Testing

A Postman collection is included: FlightAPI.postman_collection.json
Import it in Postman to test all endpoints.