// hash.js (run with node hash.js)
import bcrypt from 'bcryptjs';

(async () => {
  const pw = 'vppcoeadmin@123';
  const hash = await bcrypt.hash(pw, 10);
  console.log('bcrypt hash:', hash);
})();
