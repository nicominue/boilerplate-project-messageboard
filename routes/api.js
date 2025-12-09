const express = require('express');
const router = express.Router();
const controller = require('../controllers/threadController');

// Threads
router.post('/threads/:board', controller.createThread);
router.get('/threads/:board', controller.getThreads);
router.delete('/threads/:board', controller.deleteThread);
router.put('/threads/:board', controller.reportThread);

// Replies
router.post('/replies/:board', controller.createReply);
router.get('/replies/:board', controller.getThreadWithReplies);
router.delete('/replies/:board', controller.deleteReply);
router.put('/replies/:board', controller.reportReply);

module.exports = router;
