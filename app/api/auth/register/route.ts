import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const isFirstUser = await prisma.user.count() === 0;
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // First user is admin and auto-approved, others need approval
        role: isFirstUser ? 'admin' : 'user',
        isApproved: isFirstUser, // First user is auto-approved
      },
    });
    
    // Return user without password
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
