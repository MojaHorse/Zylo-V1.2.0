
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const pin = "1234";
const hash = await bcrypt.hash(pin);
console.log(`PIN: ${pin}`);
console.log(`Hash: ${hash}`);
console.log(`SQL Update: UPDATE profiles SET pin_hash = '${hash}' WHERE role = 'cashier';`);
