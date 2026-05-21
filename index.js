// const express = require("express");
// const dotenv = require("dotenv");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const cors = require("cors");
// const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());
// const port =process.env.PORT || 8080;

// const uri = process.env.MONGODB_URI;
//  const JWKS = createRemoteJWKSet(
//    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
// );
// //  console.log(JWKS);
// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// const logger = (req, res, next) => {
//   next();
// };

// const verifyToken = async (req, res, next) => {
//   const {authorization}=req.headers
//   const token = authorization?.split(" ")[1]
//   // console.log(token);
//   if (!token) {
//     return res.status(401).json({message:"Unauthorize"})
//   }

//    try {
//      const JWKS = createRemoteJWKSet(
//        new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
//      );
//      const { payload } = await jwtVerify(token, JWKS)

//      req.user = payload;

//      next();
//    } catch (error) {
//      console.error("Token validation failed:", error);
//      return res.status(401).json({ message: "Unauthorize" });

//    }

// };
// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//       // await client.db("admin").command({ ping: 1 });
//       const db = client.db("studynookdb");
//       const roomsCollection = db.collection("rooms")

//     app.get("/rooms", async (req, res) => {
//       const cursor = roomsCollection.find();
//       const result = await cursor.toArray();
//       res.send(result);
//     });

//     app.get("/featured", async (req, res) => {
//       const cursor = roomsCollection.find().limit(6);
//       const result = await cursor.toArray();
//       res.send(result);
//     });

//     app.get("/rooms/:roomId",
//       logger,verifyToken,

//       async (req, res) => {
//         console.log(req.user);
//           const { roomId } = req.params;
//           const query = { _id: new ObjectId(roomId) }
//           const result = await roomsCollection.findOne(query);
//           res.send(result);
//       });

//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!",
//     );
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// ── Middleware ──
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ── Logger ──
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

// ── Auth Middleware ──
const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("Token validation failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("studynookdb");
    const roomsCollection = db.collection("rooms");
    const bookingsCollection = db.collection("bookings");

    console.log("Connected to MongoDB!");

    // ────────────────────────────────────────────
    // ROOMS ROUTES
    // ────────────────────────────────────────────

    // GET /rooms — All rooms, newest first (public)
    app.get("/rooms", async (req, res) => {
      try {
        const { search, amenities, minRate, maxRate, floor } = req.query;
        const query = {};

        if (search) {
          query.name = { $regex: search, $options: "i" };
        }
        if (amenities) {
          const amenityList = amenities.split(",");
          query.amenities = { $in: amenityList };
        }
        if (minRate || maxRate) {
          query.hourlyRate = {};
          if (minRate) query.hourlyRate.$gte = Number(minRate);
          if (maxRate) query.hourlyRate.$lte = Number(maxRate);
        }
        if (floor) {
          query.floor = floor;
        }

        const result = await roomsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /featured — Latest 6 rooms for homepage
    app.get("/featured", async (req, res) => {
      try {
        const result = await roomsCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /rooms/:roomId — Single room (protected)
    app.get("/rooms/:roomId", logger, verifyToken, async (req, res) => {
      try {
        const { roomId } = req.params;
        const result = await roomsCollection.findOne({
          _id: new ObjectId(roomId),
        });
        if (!result) return res.status(404).json({ message: "Room not found" });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // POST /rooms — Create a room (protected)
    app.post("/rooms", verifyToken, async (req, res) => {
      try {
        const {
          name,
          description,
          image,
          floor,
          capacity,
          hourlyRate,
          amenities,
        } = req.body;

        if (
          !name ||
          !description ||
          !image ||
          !floor ||
          !capacity ||
          !hourlyRate
        ) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const newRoom = {
          name,
          description,
          image,
          floor,
          capacity: Number(capacity),
          hourlyRate: Number(hourlyRate),
          amenities: amenities || [],
          ownerId: req.user.sub,
          bookingCount: 0,
          createdAt: new Date(),
        };

        const result = await roomsCollection.insertOne(newRoom);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // PUT /rooms/:roomId — Update a room (owner only)
    app.put("/rooms/:roomId", verifyToken, async (req, res) => {
      try {
        const { roomId } = req.params;
        const {
          name,
          description,
          image,
          floor,
          capacity,
          hourlyRate,
          amenities,
        } = req.body;

        const room = await roomsCollection.findOne({
          _id: new ObjectId(roomId),
        });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (room.ownerId !== req.user.sub)
          return res
            .status(403)
            .json({ message: "Forbidden: You don't own this room" });

        const updated = await roomsCollection.updateOne(
          { _id: new ObjectId(roomId) },
          {
            $set: {
              name,
              description,
              image,
              floor,
              capacity: Number(capacity),
              hourlyRate: Number(hourlyRate),
              amenities: amenities || [],
              updatedAt: new Date(),
            },
          },
        );

        res.json({ message: "Room updated successfully", result: updated });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // DELETE /rooms/:roomId — Delete a room (owner only)
    app.delete("/rooms/:roomId", verifyToken, async (req, res) => {
      try {
        const { roomId } = req.params;

        const room = await roomsCollection.findOne({
          _id: new ObjectId(roomId),
        });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (room.ownerId !== req.user.sub)
          return res
            .status(403)
            .json({ message: "Forbidden: You don't own this room" });

        // Remove related bookings
        await bookingsCollection.deleteMany({ roomId: roomId });

        await roomsCollection.deleteOne({ _id: new ObjectId(roomId) });
        res.json({ message: "Room deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /my-rooms — Rooms owned by logged-in user
    app.get("/my-rooms", verifyToken, async (req, res) => {
      try {
        const rooms = await roomsCollection
          .find({ ownerId: req.user.sub })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(rooms);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // ────────────────────────────────────────────
    // BOOKINGS ROUTES
    // ────────────────────────────────────────────

    // POST /bookings — Create a booking (protected)
    app.post("/bookings", verifyToken, async (req, res) => {
      try {
        const { roomId, date, startTime, endTime, specialNote } = req.body;

        if (!roomId || !date || !startTime || !endTime) {
          return res.status(400).json({ message: "All fields are required" });
        }

        // Conflict check
        const conflict = await bookingsCollection.findOne({
          roomId,
          date,
          status: "confirmed",
          $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
        });

        if (conflict) {
          return res
            .status(409)
            .json({ message: "This time slot is already booked" });
        }

        // Get room for cost calculation
        const room = await roomsCollection.findOne({
          _id: new ObjectId(roomId),
        });
        if (!room) return res.status(404).json({ message: "Room not found" });

        const startHour = parseInt(startTime.split(":")[0]);
        const endHour = parseInt(endTime.split(":")[0]);
        const totalCost = (endHour - startHour) * room.hourlyRate;

        const newBooking = {
          roomId,
          roomName: room.name,
          roomImage: room.image,
          userId: req.user.sub,
          date,
          startTime,
          endTime,
          totalCost,
          specialNote: specialNote || "",
          status: "confirmed",
          createdAt: new Date(),
        };

        const result = await bookingsCollection.insertOne(newBooking);

        // Increment bookingCount on the room
        await roomsCollection.updateOne(
          { _id: new ObjectId(roomId) },
          { $inc: { bookingCount: 1 } },
        );

        res.status(201).json({ insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /my-bookings — Bookings for logged-in user
    app.get("/my-bookings", verifyToken, async (req, res) => {
      try {
        const bookings = await bookingsCollection
          .find({ userId: req.user.sub })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(bookings);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // PATCH /bookings/:bookingId/cancel — Cancel a booking
    app.patch("/bookings/:bookingId/cancel", verifyToken, async (req, res) => {
      try {
        const { bookingId } = req.params;

        const booking = await bookingsCollection.findOne({
          _id: new ObjectId(bookingId),
        });

        if (!booking)
          return res.status(404).json({ message: "Booking not found" });
        if (booking.userId !== req.user.sub)
          return res.status(403).json({ message: "Forbidden" });
        if (booking.status === "cancelled")
          return res.status(400).json({ message: "Booking already cancelled" });

        await bookingsCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { status: "cancelled" } },
        );

        // Decrement bookingCount on the room
        await roomsCollection.updateOne(
          { _id: new ObjectId(booking.roomId) },
          { $inc: { bookingCount: -1 } },
        );

        res.json({ message: "Booking cancelled" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  } finally {
    // Keep connection alive
  }
}

run().catch(console.dir);

// ── Root ──
app.get("/", (req, res) => {
  res.send("StudyNook API is running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});