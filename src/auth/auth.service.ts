import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AuthDto } from './dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: AuthDto) {
    // Generate the password hash
    const hashedPassword = await argon.hash(dto.password);

    // Save the new user to database
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email,
          hash: hashedPassword,
        },
      });

      // Return the saved user
      return this.generateToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }

      throw error;
    }
  }

  async login(dto: AuthDto): Promise<{ access_token: string }> {
    // Find user by email
    const existingUser = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // If user not found, throw an error
    if (!existingUser) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Compare password
    const isPasswordMatch = await argon.verify(existingUser.hash, dto.password);
    // If password incorrect, throw exception
    if (!isPasswordMatch) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const token = await this.generateToken(existingUser.id, existingUser.email);
    console.log(token);

    return token;
  }

  private async generateToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
