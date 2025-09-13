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
 * Gets userId from JWT in Authorization header.
 * Throws Response with 401 if token is missing or invalid.
 */
export function requireAuth(req: NextRequest): { userId: string } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new NextResponse(JSON.stringify({ message: 'No token provided' }), { status: 401 });
  }
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) {
    throw new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
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
    throw new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
  }
}
