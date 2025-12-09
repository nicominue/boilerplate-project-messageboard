const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/thread');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let threadId;
  let replyId;
  const board = 'testboard';
  const threadPass = 'threadpass';
  const replyPass = 'replypass';

  // Clean DB before tests
  before(function(done) {
    // wait for DB connection if needed
    Thread.deleteMany({ board }).then(() => done()).catch(err => done(err));
  });

  // 1. create a new thread
  test('Creating a new thread: POST /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'Test thread', delete_password: threadPass })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // the server redirects to /b/:board/
        assert.isTrue(res.redirects.length > 0);
        done();
      });
  });

  // 2. view the 10 most recent threads with 3 replies each
  test('Viewing threads: GET /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/' + board)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        // there should be at least one thread now
        assert.isAtLeast(res.body.length, 1);
        // capture thread id for later
        threadId = res.body[0]._id;
        done();
      });
  });

  // 3. attempt to delete thread with incorrect password
  test('Deleting a thread with incorrect password: DELETE /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/' + board)
      .send({ thread_id: threadId, delete_password: 'wrongpass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 4. delete thread with correct password should succeed (we'll recreate after to continue flow)
  test('Deleting a thread with correct password: DELETE /api/threads/{board}', function(done) {
    // create a new thread to delete cleanly
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'Thread to delete', delete_password: 'todel' })
      .end(function(err, res) {
        // find that thread
        Thread.findOne({ text: 'Thread to delete' }).then(thread => {
          chai.request(server)
            .delete('/api/threads/' + board)
            .send({ thread_id: thread._id, delete_password: 'todel' })
            .end(function(err2, res2) {
              assert.equal(res2.status, 200);
              assert.equal(res2.text, 'success');
              done();
            });
        }).catch(err => done(err));
      });
  });

  // 5. report a thread
  test('Reporting a thread: PUT /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/' + board)
      .send({ thread_id: threadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 6. create a new reply
  test('Creating a new reply: POST /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/' + board)
      .type('form')
      .send({ thread_id: threadId, text: 'Test reply', delete_password: replyPass })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isTrue(res.redirects.length > 0);
        // fetch thread to get reply id
        Thread.findById(threadId).then(t => {
          const r = t.replies[t.replies.length - 1];
          replyId = r._id;
          done();
        }).catch(e => done(e));
      });
  });

  // 7. view a single thread with all replies
  test('Viewing a single thread with all replies: GET /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/' + board)
      .query({ thread_id: threadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'replies');
        assert.isArray(res.body.replies);
        assert.isAtLeast(res.body.replies.length, 1);
        done();
      });
  });

  // 8. delete reply with incorrect password
  test('Deleting a reply with incorrect password: DELETE /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'bad' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. delete reply with correct password -> text becomes [deleted]
  test('Deleting a reply with correct password: DELETE /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: replyPass })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');

        // verify reply text changed to [deleted]
        Thread.findById(threadId).then(t => {
          const r = t.replies.id(replyId);
          assert.equal(r.text, '[deleted]');
          done();
        }).catch(e => done(e));
      });
  });

  // 10. report a reply
  test('Reporting a reply: PUT /api/replies/{board}', function(done) {
    // create a new reply to report
    chai.request(server)
      .post('/api/replies/' + board)
      .type('form')
      .send({ thread_id: threadId, text: 'Another reply', delete_password: 'rp2' })
      .end(function(err, res) {
        Thread.findById(threadId).then(t => {
          const newReply = t.replies[t.replies.length - 1];
          chai.request(server)
            .put('/api/replies/' + board)
            .send({ thread_id: threadId, reply_id: newReply._id })
            .end(function(err2, res2) {
              assert.equal(res2.status, 200);
              assert.equal(res2.text, 'reported');
              done();
            });
        }).catch(e => done(e));
      });
  });
});

