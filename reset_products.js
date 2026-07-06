const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS products', (err) => {
    if (err) {
      console.error('Error dropping products table:', err);
    } else {
      console.log('Successfully dropped products table.');
    }
  });
});

db.close();
