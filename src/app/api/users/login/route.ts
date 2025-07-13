import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Не все поля заполнены' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Неверные учетные данные' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ message: 'Неверные учетные данные' }, { status: 400 });
    }

    const payload = { user: { userId: user.userId } };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const token = jwt.sign(payload, secret, { expiresIn: '5h' });

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
