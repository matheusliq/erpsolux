const bcrypt = require('bcryptjs');
bcrypt.hash('SoluxPinturas123', 10).then(hash => console.log('HASH:', hash));
