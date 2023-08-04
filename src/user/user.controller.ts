import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard) // Setup guard to authenticate existing user this endpoint
@Controller('users')
export class UserController {
  @Get('get-info')
  getUserInformation(@GetUser() user: User) {
    return user;
  }
}
