const bcrypt = require("bcrypt");

const plainPassword = '123456';

async function hashPassword() {
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        console.log(hashedPassword);
    } catch (err) {
        console.error(err);
    }
}

hashPassword();
