import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard) // Setup guard to authenticate existing user this endpoint
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUserInformation(@GetUser() user: User) {
    return user;
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body() updatedData: EditUserDto) {
    return this.userService.editUser(userId, updatedData);
  }
}
