const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema para los replies (subdocumentos)
const ReplySchema = new Schema({
  text: { 
    type: String, 
    required: true 
  },
  created_on: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  delete_password: { 
    type: String, 
    required: true 
  },
  reported: { 
    type: Boolean, 
    required: true, 
    default: false 
  }
});

// Schema principal de Thread
const ThreadSchema = new Schema({
  board: { 
    type: String, 
    required: true, 
    index: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  created_on: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  bumped_on: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  reported: { 
    type: Boolean, 
    required: true, 
    default: false 
  },
  delete_password: { 
    type: String, 
    required: true 
  },
  replies: { 
    type: [ReplySchema], 
    default: [] 
  }
});

module.exports = mongoose.model('Thread', ThreadSchema);