import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private db: DatabaseService) {}

  getAllBookmarks(userId: number) {
    return this.db.bookmark.findMany({ where: { authorId: userId } });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.db.bookmark.findFirst({
      where: { id: bookmarkId, authorId: userId },
    });

    if (!bookmark) {
      throw new NotFoundException(
        'This bookmark does not exist in your library',
      );
    }

    return bookmark;
  }

  async createBookmark(userId: number, bookmarkDto: CreateBookmarkDto) {
    const newBookmark = await this.db.bookmark.create({
      data: {
        title: bookmarkDto.title,
        description: bookmarkDto.description,
        link: bookmarkDto.link,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return newBookmark;
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    updateBookmarkData: EditBookmarkDto,
  ) {
    const existingBookmark = await this.db.bookmark.findUnique({
      where: {
        authorId: userId,
        id: bookmarkId,
      },
    });

    if (!existingBookmark) {
      throw new NotFoundException(
        'This bookmark does not exist in your library',
      );
    }

    return this.db.bookmark.update({
      where: {
        id: bookmarkId,
        authorId: userId,
      },
      data: {
        ...updateBookmarkData,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const existingBookmark = await this.db.bookmark.findUnique({
      where: { authorId: userId, id: bookmarkId },
    });

    if (!existingBookmark) {
      throw new NotFoundException(
        'This bookmark does not exist in your library',
      );
    }

    const deletedBookmark = await this.db.bookmark.delete({
      where: { authorId: userId, id: bookmarkId },
    });

    return deletedBookmark;
  }
}
