import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';

// POST /api/media/save  – сохранить метаданные после клиентской загрузки
export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { files } = await req.json();

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ message: 'Нет файлов' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ userId });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    user.media.push(...files);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Media save error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
