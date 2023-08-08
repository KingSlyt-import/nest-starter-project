import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async editUser(userId: number, updatedData: EditUserDto) {
    const updatedUser = await this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        ...updatedData,
      },
    });

    delete updatedUser.hash;
    return updatedUser;
  }
}
