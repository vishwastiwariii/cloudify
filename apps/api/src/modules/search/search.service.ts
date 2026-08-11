import prisma from "@repo/db";

import type {
  SearchFilters,
  SearchResponse,
  SearchFileResult,
} from "./search.types";

export class SearchService {
  async searchFiles(
    userId: string,
    filters: SearchFilters
  ): Promise<SearchResponse> {
    const {
      q,
      folderId,
      mimeType,
      minSize,
      maxSize,
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    const skip =
      (page - 1) * limit;

    const where = {
      ownerId: userId,

      // Trash is excluded from normal search.
      deletedAt: null,

      ...(q && {
        name: {
          contains: q,
          mode: "insensitive" as const,
        },
      }),

      ...(folderId && {
        folderId,
      }),

      ...(mimeType && {
        mimeType,
      }),

      ...((minSize !== undefined ||
        maxSize !== undefined) && {
        size: {
          ...(minSize !== undefined && {
            gte: minSize,
          }),

          ...(maxSize !== undefined && {
            lte: maxSize,
          }),
        },
      }),

      ...((from !== undefined ||
        to !== undefined) && {
        createdAt: {
          ...(from !== undefined && {
            gte: from,
          }),

          ...(to !== undefined && {
            lte: to,
          }),
        },
      }),
    };

    const [files, total] =
      await prisma.$transaction([
        prisma.file.findMany({
          where,

          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            folderId: true,
            createdAt: true,
            updatedAt: true,
          },

          orderBy: {
            [sortBy]: sortOrder,
          },

          skip,

          take: limit,
        }),

        prisma.file.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    const items: SearchFileResult[] =
      files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size.toString(),
        folderId: file.folderId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      }));

    return {
      items,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}