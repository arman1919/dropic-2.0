import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Album from '@/models/Album';
import User from '@/models/User';

// GET /api/albums/:albumId – получить один альбом текущего пользователя
export async function GET(
  req: NextRequest,
  { params }: { params: any },
) {
  try {
    const { userId } = requireAuth(req);
    const { albumId } = params;
    await connectDB();

    const album = await Album.findOne({ albumId, userId }).lean();
    if (!album) {
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json({ album });
  } catch (err: any) {
    console.error('Album GET error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/albums/:albumId – обновить название и/или список фотоIds
export async function PUT(
  req: NextRequest,
  { params }: { params: any },
) {
  try {
    const { userId } = requireAuth(req);
    const { albumId } = params;
    const body = await req.json();
    const { title, photoIds, description, photos } = body || {};

    await connectDB();
    const album = await Album.findOne({ albumId, userId });
    if (!album) {
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }

    if (title !== undefined) album.title = title;
    if (description !== undefined) album.description = description;

    // Обновление состава фото, если передан массив идентификаторов
    if (Array.isArray(photoIds)) {
      const user = await User.findOne({ userId }).lean();
      const mediaMap = new Map<string, any>();
      (user?.media || []).forEach((p: any) => {
        if (p.photoId) mediaMap.set(p.photoId, p);
        if (p.publicId) mediaMap.set(p.publicId, p);
        if (p.filename) {
          mediaMap.set(p.filename, p);
          const noExt = p.filename.replace(/\.[^/.]+$/, '');
          mediaMap.set(noExt, p);
        }
      });

      const oldPhotosMap = new Map<string, any>((album.photos || []).map((p: any) => [p.photoId, p]));
      album.photos = photoIds
        .map((id: string) => {
          const fromMedia = mediaMap.get(id);
          if (!fromMedia) {
            console.warn(`Media not found for photoId ${id}, skipping`);
            return null;
          }
          const old = oldPhotosMap.get(id) || {};
          return {
            ...fromMedia,
            photoId: fromMedia.photoId || id,
            description: old.description ?? fromMedia.description,
            description_hidden: old.description_hidden ?? fromMedia.description_hidden,
            date: old.date ?? fromMedia.date,
            date_hidden: old.date_hidden ?? fromMedia.date_hidden,
          };
        })
        .filter(Boolean);
    }

    // Тонкое обновление свойств отдельных фото
    if (Array.isArray(photos)) {
      album.photos = album.photos.map((photo: any) => {
        const updated = photos.find((p: any) => p.photoId === photo.photoId);
        if (updated) {
          return {
            ...photo,
            description: updated.description ?? photo.description,
            description_hidden: updated.description_hidden ?? photo.description_hidden,
            date: updated.date ?? photo.date,
            date_hidden: updated.date_hidden ?? photo.date_hidden,
          };
        }
        return photo;
      });
    }

    await album.save();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Album PUT error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/albums/:albumId?token=<deleteToken> – удалить альбом
export async function DELETE(
  req: NextRequest,
  { params }: { params: any },
) {
  try {
    const { userId } = requireAuth(req);
    const { albumId } = params;
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ message: 'Token query param required' }, { status: 400 });
    }

    await connectDB();
    const album = await Album.findOne({ albumId, userId });
    if (!album) {
      return NextResponse.json({ message: 'Album not found' }, { status: 404 });
    }
    if (album.deleteToken !== token) {
      return NextResponse.json({ message: 'Invalid delete token' }, { status: 403 });
    }

    await Album.deleteOne({ _id: album._id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Album DELETE error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
