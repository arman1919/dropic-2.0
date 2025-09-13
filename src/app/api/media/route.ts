import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';

// GET /api/media – список медиа текущего пользователя
// GET list
export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    await connectDB();
    const user = await User.findOne({ userId }).lean();
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json({ media: user.media || [] });
  } catch (err: any) {
    console.error('Media list error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
