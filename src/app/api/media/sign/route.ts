import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';

const { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_SECRET } = process.env;

// POST /api/media/sign  { publicId?: string, folder?: string }
export async function POST(req: NextRequest) {
  try {
    requireAuth(req); // just need token validity, userId can be omitted

    if (!CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_SECRET) {
      return NextResponse.json({ message: 'Cloudinary env vars missing' }, { status: 500 });
    }

    const { publicId, folder } = await req.json();
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign: Record<string, any> = {
      timestamp,
    };
    if (publicId) paramsToSign.public_id = publicId;
    if (folder) paramsToSign.folder = folder;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

    return NextResponse.json({
      timestamp,
      signature,
      apiKey: CLOUDINARY_API_KEY,
      cloudName: CLOUDINARY_CLOUD_NAME,
      publicId: publicId || null,
      folder: folder || null,
    });
  } catch (err: any) {
    console.error('Sign error:', err);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
