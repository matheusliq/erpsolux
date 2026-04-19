import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.users.findMany()
  console.log("USERS:", users.map(u => u.username))
  
  for (const u of users) {
     if (u.username.toLowerCase() === 'matheus.liquer') {
       const isMatch = await bcrypt.compare('SoluxPinturas123', u.password)
       console.log("MATCH:", isMatch)
     }
  }
}
main()
