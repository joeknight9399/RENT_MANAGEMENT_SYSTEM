const bcrypt = require('bcrypt');

async function run() {
    const password = '0721458797JAMEs!';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('--- YOUR HASHED PASSWORD ---');
    console.log(hash);
}

run();