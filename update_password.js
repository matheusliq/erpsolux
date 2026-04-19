const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = "matheus.liquer";
  const rawPassword = "SoluxPinturas123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  const user = await prisma.users.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } }
  });

  if (user) {
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword, username: username }
    });
    console.log("Password updated successfully for " + username);
  } else {
    // Create it just in case
    await prisma.users.create({
      data: {
        name: "Matheus Liquer",
        username: username,
        password: hashedPassword,
        role: "admin"
      }
    });
    console.log("User " + username + " created successfully.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
