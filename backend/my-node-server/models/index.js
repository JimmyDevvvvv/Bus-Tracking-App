// models/index.js
// ───────────────────────────────────────────────
// Register all your Mongoose models in one place

import './Bus.js'; // registers mongoose.model('Bus', ...)
import './location.js'; // registers mongoose.model('Location', ...)
import './User.js'; // registers mongoose.model('User', ...)

// (Optional) you could re-export them here if you like:
// import User from './User.js';
// import Bus from './Bus.js';
// import Location from './Location.js';
// export { User, Bus, Location };
