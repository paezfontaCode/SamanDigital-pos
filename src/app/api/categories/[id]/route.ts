import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Verificar si la categoría tiene productos asociados
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0 && !name) {
      // Si tiene productos y se intenta cambiar el nombre, verificar
      const existing = await prisma.productCategory.findUnique({
        where: { id },
        include: { products: true },
      });

      if (existing && existing.name !== name) {
        // Permitir cambio de nombre solo si no hay productos o manejar el caso
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        name,
        description: description || null,
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

    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar si la categoría tiene productos asociados
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `No se puede eliminar: esta categoría tiene ${productCount} producto(s) asociado(s)` 
        },
        { status: 400 }
      );
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Error al eliminar categoría' }, { status: 500 });
  }
}
