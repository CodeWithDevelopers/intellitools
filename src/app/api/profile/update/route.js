import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function PUT(request) {
  try {
    await connectDB();

    // Get token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get form data
    const formData = await request.formData();
    const name = formData.get('name');
    const bio = formData.get('bio');
    const avatar = formData.get('avatar');

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate input
    if (name) {
      if (name.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
      }
      user.name = name;
    }

    if (bio) {
      if (bio.length > 200) {
        return NextResponse.json({ error: 'Bio cannot be longer than 200 characters' }, { status: 400 });
      }
      user.bio = bio;
    }

    // Handle avatar upload
    if (avatar) {
      if (!(avatar instanceof Blob)) {
        return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
      }

      if (avatar.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
      }

      if (!avatar.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
      }

      try {
        const buffer = await avatar.arrayBuffer();
        user.avatar = {
          data: Buffer.from(buffer),
          contentType: avatar.type
        };
      } catch (error) {
        console.error('Avatar processing error:', error);
        return NextResponse.json({ error: 'Failed to process avatar' }, { status: 500 });
      }
    }

    // Save user
    try {
      await user.save();
    } catch (error) {
      console.error('User save error:', error);
      return NextResponse.json({ error: 'Failed to save user data' }, { status: 500 });
    }

    // Return updated user without sensitive data
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      role: user.role,
      avatar: user.avatar ? {
        contentType: user.avatar.contentType,
        url: `/api/profile/avatar/${user._id}`
      } : null
    };

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
