import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  user: {
    userId: string;
  };
  iat: number;
  exp: number;
}

/**
 * Получает userId из JWT в заголовке Authorization.
 * Бросает Response с 401, если токен отсутствует или недействителен.
 */
export function requireAuth(req: NextRequest): { userId: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new NextResponse(JSON.stringify({ message: 'Нет токена' }), { status: 401 });
  }
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) {
    throw new NextResponse(JSON.stringify({ message: 'Неверный токен' }), { status: 401 });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET env var not set');
    }
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return { userId: decoded.user.userId };
  } catch (err) {
    console.error('JWT verify error', err);
    throw new NextResponse(JSON.stringify({ message: 'Неверный токен' }), { status: 401 });
  }
}
