"use strict";

const Thread = require("../models/thread");

module.exports = function (app) {

  app.route("/api/threads/:board")

    // CREATE THREAD
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      const thread = new Thread({
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });

      await thread.save();
      res.json(thread);
    })

    // GET THREADS
    .get(async (req, res) => {
      const board = req.params.board;

      const threads = await Thread
        .find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads.forEach(t => {
        delete t.delete_password;
        delete t.reported;
        t.replies = t.replies
          .slice(-3)
          .map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }));
      });

      res.json(threads);
    })

    // DELETE THREAD
    .delete(async (req, res) => {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;

      const thread = await Thread.findOne({ _id: thread_id, board });

      if (!thread) return res.send("incorrect password");
      if (thread.delete_password !== delete_password)
        return res.send("incorrect password");

      await Thread.deleteOne({ _id: thread_id });
      res.send("success");
    })

    // REPORT THREAD
    .put(async (req, res) => {
      const { thread_id } = req.body;

      await Thread.updateOne(
        { _id: thread_id },
        { $set: { reported: true } }
      );

      res.send("reported");
    });

  app.route("/api/replies/:board")

    // CREATE REPLY
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password, thread_id } = req.body;

      const thread = await Thread.findOne({ _id: thread_id, board });
      if (!thread) return res.json({ error: "thread not found" });

      const reply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(reply);
      thread.bumped_on = new Date();

      await thread.save();
      res.json(thread);
    })

    // GET SINGLE THREAD WITH ALL REPLIES
    .get(async (req, res) => {
      const board = req.params.board;
      const thread_id = req.query.thread_id;

      const thread = await Thread.findOne({ _id: thread_id, board }).lean();
      if (!thread) return res.json({ error: "not found" });

      delete thread.delete_password;
      delete thread.reported;

      thread.replies = thread.replies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));

      res.json(thread);
    })

    // DELETE REPLY
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;

      const thread = await Thread.findOne({ _id: thread_id });
      if (!thread) return res.send("incorrect password");

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send("incorrect password");

      if (reply.delete_password !== delete_password)
        return res.send("incorrect password");

      reply.text = "[deleted]";
      await thread.save();
      res.send("success");
    })

    // REPORT REPLY
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;

      const thread = await Thread.findOne({ _id: thread_id });
      if (!thread) return res.send("error");

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send("error");

      reply.reported = true;
      await thread.save();

      res.send("reported");
    });
};
