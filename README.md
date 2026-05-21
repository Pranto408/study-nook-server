# 🖥️ StudyNook API (Server-Side)

The reliable, high-performance backend engine powering StudyNook. Built on a modular Express.js architecture, it securely handles automated slot validation, booking workflows, user validation pipelines, and direct communication with MongoDB.

---

## ⚡ Core Functionalities

* **🛡️ Remote JWKS Validation:** Uses `jose-cjs` to fetch remote JSON Web Key Sets from the client instance for stateless, secure user verification.
* **⏱️ Smart Conflict Prevention:** Features atomic MongoDB logical conditions to block any duplicate or overlapping bookings (`$or` boundaries combined with time constraints).
* **📈 Dynamic Aggregations:** Keeps precise tracking of `bookingCount` increments and decrements directly tied to room objects upon confirmations/cancellations.
* **🎛️ Middleware Pipeline:** Implements structural logging layers and custom route guards protecting structural data inputs (POST/PUT/DELETE actions).

---

## 🛠️ Tech Stack

* **Runtime Environment:** Node.js
* **Backend Framework:** Express.js
* **Database:** MongoDB (via Native Node Driver)
* **Security & Token Verification:** `jose-cjs`, `cors`
* **Environment Configuration:** `dotenv`

---

## 📡 API Endpoints

### 🔓 Public Routes
* `GET /` — API health status check.
* `GET /rooms` — Fetch all spaces with query parameters (`?search=`, `?amenities=`, `?minRate=`, `?maxRate=`, `?floor=`).
* `GET /featured` — Returns the 6 newest rooms sorted by creation date.

### 🔐 Protected Routes (Requires valid Authorization Bearer Token)
* `GET /rooms/:roomId` — Fetch comprehensive details for a single room.
* `POST /rooms` — Create a new study space.
* `PUT /rooms/:roomId` — Modify a room configuration (Owner-only validation).
* `DELETE /rooms/:roomId` — Remove a room and clear all associated bookings (Owner-only validation).
* `GET /my-rooms` — Retrieve all spaces created by the authenticated user.
* `POST /bookings` — Book a room with dynamic hourly cost calculation and scheduling collision guards.
* `GET /my-bookings` — Fetch the user's booking history.
* `PATCH /bookings/:bookingId/cancel` — Cancel a booking reservation and update room booking analytics.

---

## 🗄️ Database Schemas (MongoDB Collections)

### 🏫 `rooms`
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "image": "String",
  "floor": "String",
  "capacity": "Number",
  "hourlyRate": "Number",
  "amenities": "Array",
  "ownerId": "String",
  "bookingCount": "Number",
  "createdAt": "Date"
}
