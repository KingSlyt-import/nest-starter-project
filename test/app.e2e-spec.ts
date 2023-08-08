import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let database: DatabaseService;

  const PORT = 5000;

  beforeAll(async () => {
    const moduleReaf = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleReaf.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(PORT);

    database = app.get(DatabaseService);
    await database.cleanDb();

    pactum.request.setBaseUrl(`http://localhost:${PORT}`);
  });

  describe('Authenticate test', () => {
    const authDto: AuthDto = {
      email: 'quanguyen.work@gmail.com',
      password: 'ducquan123',
    };

    describe('Register', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post(`/auth/register`)
          .withBody({ password: authDto.password })
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post(`/auth/register`)
          .withBody({ email: authDto.email })
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should throw error if body is empty', () => {
        return pactum
          .spec()
          .post(`/auth/register`)
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should register', () => {
        return pactum
          .spec()
          .post(`/auth/register`)
          .withBody(authDto)
          .expectStatus(201)
          .expectBodyContains('access_token');
      });
    });

    describe('Login', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post(`/auth/login`)
          .withBody({ password: authDto.password })
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post(`/auth/login`)
          .withBody({ email: authDto.email })
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should throw error if body is empty', () => {
        return pactum
          .spec()
          .post(`/auth/login`)
          .expectStatus(400)
          .expectBodyContains('error');
      });

      it('Should login', () => {
        return pactum
          .spec()
          .post(`/auth/login`)
          .withBody(authDto)
          .expectStatus(200)
          .expectBodyContains('access_token')
          .stores('userAt', 'access_token'); // Store JWT token to pactum
      });
    });
  });

  describe('User test', () => {
    const updateUserData: EditUserDto = {
      email: 'quanguyen.work@gmail.com',
      firstName: 'Van A',
      lastName: 'Nguyen',
    };

    describe('Get user information', () => {
      it('Should get current user information', () => {
        return pactum
          .spec()
          .get(`/users`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('id')
          .expectBodyContains('firstName')
          .expectBodyContains('lastName');
      });

      it('Should throw error when there no JWT token', () => {
        return pactum.spec().get(`/users`).expectStatus(401).expectBody({
          message: 'Unauthorized',
          statusCode: 401,
        });
      });
    });

    describe('Edit user', () => {
      it('Should edit the current user information', () => {
        return pactum
          .spec()
          .patch(`/users`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(updateUserData)
          .expectStatus(200)
          .expectBodyContains(updateUserData.email)
          .expectBodyContains(updateUserData.firstName)
          .expectBodyContains(updateUserData.lastName);
      });

      it('Should throw error when there no JWT token', () => {
        return pactum.spec().patch(`/users`).expectStatus(401).expectBody({
          message: 'Unauthorized',
          statusCode: 401,
        });
      });
    });
  });

  describe('Bookmark test', () => {
    const bookmarkData: CreateBookmarkDto = {
      title: 'A random book',
      description: 'This a random description for the one and only random book',
      link: null,
    };

    describe('Authorization on bookmark test', () => {
      it('Should throw error when there no JWT token', () => {
        return pactum.spec().get(`/bookmarks`).expectStatus(401).expectBody({
          message: 'Unauthorized',
          statusCode: 401,
        });
      });

      it('Should return an empty array', () => {
        return pactum
          .spec()
          .get(`/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains({
            total: 0,
            data: [],
          });
      });
    });

    describe('Create user', () => {
      it('Should create a bookmark', () => {
        return pactum
          .spec()
          .post(`/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(bookmarkData)
          .expectStatus(201)
          .expectBodyContains(bookmarkData.title)
          .expectBodyContains(bookmarkData.description)
          .expectBodyContains(bookmarkData.link);
      });
    });

    describe('Get all bookmark', () => {
      it('Should return all the bookmark', () => {
        return pactum
          .spec()
          .get(`/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('total')
          .expectBodyContains('data')
          .stores('bookmarkId', 'data[0].id');
      });
    });

    describe('Get bookmark by Id', () => {
      it('Should return the bookmark by Id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains(bookmarkData.title)
          .expectBodyContains(bookmarkData.description)
          .expectBodyContains(bookmarkData.link);
      });

      it('Should throw error if the bookmark Id invalid', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '12345')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(404)
          .expectBody({
            message: 'This bookmark does not exist in your library',
            error: 'Not Found',
            statusCode: 404,
          });
      });
    });

    describe('Edit bookmark by Id', () => {
      const updateBookmarkData: CreateBookmarkDto = {
        title: 'A second random book',
        description:
          'This is no more a random description for the one and only random book',
        link: 'https://github.com/KingSlyt-import',
      };

      it('Should return the edited bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(updateBookmarkData)
          .expectStatus(200)
          .expectBodyContains(updateBookmarkData.title)
          .expectBodyContains(updateBookmarkData.description)
          .expectBodyContains(updateBookmarkData.link);
      });

      it('Should throw error if the bookmark Id invalid', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '12345')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(404)
          .expectBody({
            message: 'This bookmark does not exist in your library',
            error: 'Not Found',
            statusCode: 404,
          });
      });
    });

    describe('Delete bookmark by Id', () => {
      it('Should return the deleted bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });

      it('Should throw error if the bookmark Id invalid', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '12345')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(404)
          .expectBody({
            message: 'This bookmark does not exist in your library',
            error: 'Not Found',
            statusCode: 404,
          })
          .inspect();
      });
    });
  });

  afterAll(async () => {
    app.close();
  });
});
