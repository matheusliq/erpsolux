import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const users = await prisma.users.findMany();
        
        let found = null;
        for (const user of users) {
             const isMatch = await bcrypt.compare('SoluxPinturas123', user.password);
             if (isMatch || user.username.toLowerCase() === 'matheus.liquer') {
                 found = {
                     username: user.username,
                     hashLength: user.password.length,
                     passwordMatchesTarget: isMatch,
                     dbHash: user.password
                 };
             }
        }
        return NextResponse.json({ success: true, count: users.length, allUsers: users.map(u => u.username), matchDetails: found });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
