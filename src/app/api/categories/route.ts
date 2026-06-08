import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type } = body;

    // Validar datos básicos
    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: 'Nombre y tipo son requeridos' },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        description: description || null,
        type,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Error al crear categoría' }, { status: 500 });
  }
}
