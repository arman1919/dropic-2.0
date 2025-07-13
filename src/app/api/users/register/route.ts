import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password)
      return NextResponse.json({ message: 'Не все поля заполнены' }, { status: 400 });

    await connectDB();

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user)
      return NextResponse.json({ message: 'Пользователь уже существует' }, { status: 409 });

    user = new User({ userId: uuidv4(), username, email });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { userId: user.userId } };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const token = jwt.sign(payload, secret, { expiresIn: '5h' });

    return NextResponse.json({ success: true, token }, { status: 201 });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
