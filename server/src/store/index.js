// Unified async data-access layer.
// - When MongoDB is connected, reads/writes go to Mongoose models.
// - Otherwise everything falls back to the local JSON store (db.js).
// Routes depend only on this interface, never on the storage engine.

import { nanoid } from "nanoid";
import { db } from "../db.js";
import { isMongoConnected } from "../db/mongo.js";
import { User, Prediction, League } from "../models/index.js";

const useMongo = () => isMongoConnected();

// ---- mappers (normalise Mongo docs to plain objects with string `id`) ----
function mapUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id ?? o.id),
    googleId: o.googleId ?? null,
    email: o.email,
    name: o.name,
    avatar: o.avatar ?? "",
    passwordHash: o.passwordHash ?? null,
    role: o.role ?? "player",
    points: o.points ?? 0,
    lastRank: o.lastRank ?? null,
  };
}

function mapPrediction(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id ?? o.id),
    userId: String(o.userId),
    matchId: o.matchId,
    matchday: o.matchday ?? 1,
    homeScore: o.homeScore,
    awayScore: o.awayScore,
    firstTeam: o.firstTeam ?? "none",
    firstPlayer: o.firstPlayer ?? "",
    double: Boolean(o.double),
    locked: Boolean(o.locked),
    points: o.points ?? 0,
  };
}

function mapLeague(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id ?? o.id),
    name: o.name,
    type: o.type,
    ownerId: o.ownerId,
    inviteCode: o.inviteCode ?? null,
    maxMembers: o.maxMembers,
    members: o.members ?? [],
  };
}

export const store = {
  async init() {
    await db.init();
    // Seed a global public league in Mongo on first run.
    if (useMongo()) {
      const exists = await League.findOne({ name: "Global League" });
      if (!exists) {
        await League.create({
          name: "Global League",
          type: "public",
          ownerId: "system",
          inviteCode: null,
          maxMembers: 1000000,
          members: [],
        });
      }
    }
  },

  seedMembers() {
    return [];
  },

  users: {
    async create(data) {
      if (useMongo()) {
        const doc = await User.create(data);
        return mapUser(doc);
      }
      const user = { id: nanoid(), role: "player", points: 0, lastRank: null, createdAt: new Date().toISOString(), ...data };
      await db.write((s) => {
        s.users.push(user);
        const global = s.leagues.find((l) => l.id === "global");
        if (global && !global.members.includes(user.id)) global.members.push(user.id);
      });
      return user;
    },
    async findByEmail(email) {
      if (useMongo()) return mapUser(await User.findOne({ email: email.toLowerCase() }));
      return db.get().users.find((u) => u.email === email.toLowerCase()) ?? null;
    },
    async findById(id) {
      if (useMongo()) return mapUser(await User.findById(id).catch(() => null));
      return db.get().users.find((u) => u.id === id) ?? null;
    },
    async findByGoogleId(googleId) {
      if (useMongo()) return mapUser(await User.findOne({ googleId }));
      return db.get().users.find((u) => u.googleId === googleId) ?? null;
    },
    async all() {
      if (useMongo()) return (await User.find()).map(mapUser);
      return db.get().users;
    },
    async update(id, patch) {
      if (useMongo()) return mapUser(await User.findByIdAndUpdate(id, patch, { new: true }));
      await db.write((s) => {
        const u = s.users.find((x) => x.id === id);
        if (u) Object.assign(u, patch);
      });
      return db.get().users.find((u) => u.id === id) ?? null;
    },
  },

  predictions: {
    async byUser(userId) {
      if (useMongo()) return (await Prediction.find({ userId })).map(mapPrediction);
      return db.get().predictions.filter((p) => p.userId === userId);
    },
    async all() {
      if (useMongo()) return (await Prediction.find()).map(mapPrediction);
      return db.get().predictions;
    },
    async upsert(userId, matchId, data) {
      if (useMongo()) {
        const doc = await Prediction.findOneAndUpdate(
          { userId, matchId },
          { $set: { ...data, userId, matchId } },
          { new: true, upsert: true }
        );
        return mapPrediction(doc);
      }
      let saved;
      await db.write((s) => {
        const existing = s.predictions.find((p) => p.userId === userId && p.matchId === matchId);
        if (existing) {
          Object.assign(existing, data, { updatedAt: new Date().toISOString() });
          saved = existing;
        } else {
          saved = { id: nanoid(), userId, matchId, locked: false, points: 0, createdAt: new Date().toISOString(), ...data };
          s.predictions.push(saved);
        }
      });
      return saved;
    },
    async clearDoubleExcept(userId, matchId) {
      if (useMongo()) {
        await Prediction.updateMany({ userId, matchId: { $ne: matchId } }, { $set: { double: false } });
        return;
      }
      await db.write((s) => {
        s.predictions
          .filter((p) => p.userId === userId && p.matchId !== matchId)
          .forEach((p) => (p.double = false));
      });
    },
  },

  leagues: {
    async all() {
      if (useMongo()) return (await League.find()).map(mapLeague);
      return db.get().leagues;
    },
    async findById(id) {
      if (useMongo()) return mapLeague(await League.findById(id).catch(() => null));
      return db.get().leagues.find((l) => l.id === id) ?? null;
    },
    async findPublicById(id) {
      const l = await this.findById(id);
      return l && l.type === "public" ? l : null;
    },
    async findByInvite(code) {
      if (useMongo()) return mapLeague(await League.findOne({ inviteCode: code }));
      return db.get().leagues.find((l) => l.inviteCode === code) ?? null;
    },
    async create(data) {
      if (useMongo()) return mapLeague(await League.create(data));
      const league = { id: nanoid(10), inviteCode: null, members: [], createdAt: new Date().toISOString(), ...data };
      await db.write((s) => s.leagues.push(league));
      return league;
    },
    async addMember(id, userId) {
      if (useMongo()) {
        await League.findByIdAndUpdate(id, { $addToSet: { members: userId } });
        return;
      }
      await db.write((s) => {
        const l = s.leagues.find((x) => x.id === id);
        if (l && !l.members.includes(userId)) l.members.push(userId);
      });
    },
  },
};
