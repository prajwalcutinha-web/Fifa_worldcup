// Mongoose schemas (MongoDB collections) for the WC26 Predictor League.
// Mirrors the data model described in the project spec.

import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ---- users ----
const userSchema = new Schema(
  {
    googleId: { type: String, index: true, sparse: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    passwordHash: { type: String, default: null }, // null for OAuth-only accounts
    role: { type: String, enum: ["player", "admin"], default: "player" },
    points: { type: Number, default: 0 },
    lastRank: { type: Number, default: null },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ---- predictions ----
const predictionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchId: { type: Number, required: true },
    matchday: { type: Number, default: 1 },
    homeScore: { type: Number, required: true, min: 0, max: 99 },
    awayScore: { type: Number, required: true, min: 0, max: 99 },
    firstTeam: { type: String, enum: ["home", "away", "none"], default: "none" },
    firstPlayer: { type: String, default: "" },
    double: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);
predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

// ---- leagues ----
const leagueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    ownerId: { type: String, required: true },
    inviteCode: { type: String, default: null, index: true },
    maxMembers: { type: Number, default: 100 },
    members: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || model("User", userSchema);
export const Prediction = mongoose.models.Prediction || model("Prediction", predictionSchema);
export const League = mongoose.models.League || model("League", leagueSchema);

// ---- fixtures (synced from the live results feed by the cron) ----
const fixtureSchema = new Schema(
  {
    // Stable numeric id derived from the team pairing (so predictions can
    // reference a match consistently across syncs).
    id: { type: Number, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true },
    home: String, homeCode: String, homeFlag: String,
    away: String, awayCode: String, awayFlag: String,
    time: String, date: String, stadium: String, city: String,
    group: String, matchday: { type: Number, default: 1 },
    state: { type: String, default: "upcoming" }, // upcoming|live|finished
    score: { type: String, default: null },
    minute: { type: Number, default: null },
    statusText: { type: String, default: "" },
    kickoff: { type: String, default: null },
    source: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Fixture = mongoose.models.Fixture || model("Fixture", fixtureSchema);
