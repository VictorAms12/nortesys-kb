import { randomBytes } from "node:crypto";
// A saída só deve ser usada localmente, NÃO enviada a chats ou repositórios.
console.log(randomBytes(48).toString("base64url"));
