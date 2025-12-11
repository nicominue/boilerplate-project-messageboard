const Thread = require('../models/thread');
const mongoose = require('mongoose');

exports.createThread = async (req, res) => {
  try {
    const board = req.params.board;
    const { text, delete_password } = req.body;
    if (!text || !delete_password) return res.status(400).send('missing fields');

    const now = new Date(); // <-- usar el mismo timestamp para ambos campos

    const thread = new Thread({
      board,
      text,
      delete_password,
      created_on: now,
      bumped_on: now
      // reported tiene default en el schema
    });

    await thread.save();
    return res.redirect(`/b/${board}/`);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.getThreads = async (req, res) => {
  try {
    const board = req.params.board;
    // get 10 most recently bumped threads, each with up to 3 most recent replies
    let threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    threads = threads.map(t => {
      // sort replies by created_on descending and take top 3
      const sortedReplies = (t.replies || []).sort((a, b) => new Date(b.created_on) - new Date(a.created_on)).slice(0,3);
      // remove sensitive fields and convert dates
      const replies = sortedReplies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));
      return {
        _id: t._id,
        text: t.text,
        created_on: t.created_on,
        bumped_on: t.bumped_on,
        replies,
        replycount: (t.replies || []).length
      };
    });

    res.json(threads);
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.deleteThread = async (req, res) => {
  try {
    const board = req.params.board;
    const { thread_id, delete_password } = req.body;
    if (!thread_id || !delete_password) return res.status(400).send('missing fields');

    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('not found');

    if (thread.delete_password !== delete_password) return res.send('incorrect password');

    await Thread.deleteOne({ _id: thread_id });
    return res.send('success');
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.reportThread = async (req, res) => {
  try {
    const board = req.params.board;
    const { thread_id } = req.body;
    if (!thread_id) return res.status(400).send('missing fields');
    const thread = await Thread.findByIdAndUpdate(thread_id, { reported: true }, { new: true });
    if (!thread) return res.status(404).send('not found');
    return res.send('reported');
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.createReply = async (req, res) => {
  try {
    const board = req.params.board;
    const { thread_id, text, delete_password } = req.body;
    if (!thread_id || !text || !delete_password) return res.status(400).send('missing fields');

    const now = new Date(); // <-- mismísimo timestamp para reply.created_on y thread.bumped_on

    const reply = {
      text,
      delete_password,
      created_on: now,
      reported: false   // <-- obligatorio para pasar el test
    };

    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('not found');

    thread.replies.push(reply);
    thread.bumped_on = now;
    await thread.save();

    return res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.getThreadWithReplies = async (req, res) => {
  try {
    const board = req.params.board;
    const thread_id = req.query.thread_id;
    if (!thread_id) return res.status(400).send('missing fields');

    const thread = await Thread.findById(thread_id).lean();
    if (!thread) return res.status(404).send('not found');

    const replies = (thread.replies || []).map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }));

    const result = {
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies
    };

    res.json(result);
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const board = req.params.board;
    const { thread_id, reply_id, delete_password } = req.body;
    if (!thread_id || !reply_id || !delete_password) return res.status(400).send('missing fields');

    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('not found');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('not found');

    if (reply.delete_password !== delete_password) return res.send('incorrect password');

    // On success change text to [deleted]
    reply.text = '[deleted]';
    await thread.save();
    return res.send('success');
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.reportReply = async (req, res) => {
  try {
    const board = req.params.board;
    const { thread_id, reply_id } = req.body;
    if (!thread_id || !reply_id) return res.status(400).send('missing fields');

    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('not found');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('not found');

    reply.reported = true;
    await thread.save();
    return res.send('reported');
  } catch(err) {
    console.error(err);
    res.status(500).send('error');
  }
};
