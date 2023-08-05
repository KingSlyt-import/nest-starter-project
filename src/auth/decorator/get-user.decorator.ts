import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator for getting user info based on JWT payload
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
