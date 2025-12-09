"use strict";

const Thread = require("../models/thread");

module.exports = function (app) {
  
  // THREADS -----------------------------
  app.route("/api/threads/:board")
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

    .get(async (req, res) => {
      const board = req.params.board;

      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads.forEach(t => {
        t.replies = t.replies.slice(-3);
        delete t.delete_password;
        delete t.reported;

        t.replies.forEach(r => {
          delete r.delete_password;
          delete r.reported;
        });
      });

      res.json(threads);
    })

    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;

      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send("incorrect password");

      if (thread.delete_password !== delete_password)
        return res.send("incorrect password");

      await Thread.deleteOne({ _id: thread_id });
      res.send("success");
    })

    .put(async (req, res) => {
      const { thread_id } = req.body;

      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send("reported");
    });


  // REPLIES -----------------------------
  app.route("/api/replies/:board")
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;

      const reply = {
        _id: new Date().valueOf().toString(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      const thread = await Thread.findById(thread_id);
      thread.replies.push(reply);
      thread.bumped_on = new Date();
      await thread.save();

      res.json(thread);
    })

    .get(async (req, res) => {
      const { thread_id } = req.query;

      const thread = await Thread.findById(thread_id).lean();

      delete thread.delete_password;
      delete thread.reported;

      thread.replies.forEach(r => {
        delete r.delete_password;
        delete r.reported;
      });

      res.json(thread);
    })

    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;

      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      if (!reply || reply.delete_password !== delete_password)
        return res.send("incorrect password");

      reply.text = "[deleted]";
      await thread.save();

      res.send("success");
    })

    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;

      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      reply.reported = true;
      await thread.save();

      res.send("reported");
    });
};
