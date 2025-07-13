import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import User from '@/models/User';
import { cloudinary } from '@/lib/cloudinary';

// DELETE /api/media/:photoId – удаление фото из Cloudinary и user.media
export async function DELETE(
  req: NextRequest,
  { params }: { params: any },
) {
  try {
    const { userId } = requireAuth(req);
    const { photoId } = params;

    await connectDB();
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const photo = user.media.find((p: any) => p.photoId === photoId);
    if (!photo) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Если фото хранится в Cloudinary – удаляем
    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
      } catch (cloudErr: any) {
        console.error('Cloudinary destroy error:', cloudErr);
        // Не прерываем – продолжаем удалять локально
      }
    }

    // Удаляем из массива media
    user.media = user.media.filter((p: any) => p.photoId !== photoId);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Media DELETE error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
