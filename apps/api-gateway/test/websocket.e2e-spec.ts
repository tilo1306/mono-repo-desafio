import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('WebSocket Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let client: Socket;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (client) {
      client.disconnect();
    }
    if (dataSource) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE notifications CASCADE');
      await dataSource.query('TRUNCATE TABLE comments CASCADE');
      await dataSource.query('TRUNCATE TABLE assignees CASCADE');
      await dataSource.query('TRUNCATE TABLE tasks CASCADE');
      await dataSource.query('TRUNCATE TABLE users CASCADE');
    }

    const registerData = {
      name: 'WebSocket Test User',
      email: 'websocket@test.com',
      password: 'Test123!',
    };

    await app.getHttpServer().post('/api/auth/register').send(registerData);

    const loginResponse = await app
      .getHttpServer()
      .post('/api/auth/login')
      .send({
        email: registerData.email,
        password: registerData.password,
      });

    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
  });

  afterEach(async () => {
    if (client) {
      client.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    it('should connect with valid token', done => {
      client = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', error => {
        done(error);
      });
    });

    it('should connect with token in query', done => {
      client = io('http://localhost:3001', {
        query: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', error => {
        done(error);
      });
    });

    it('should connect with token in Authorization header', done => {
      client = io('http://localhost:3001', {
        extraHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });

      client.on('connect_error', error => {
        done(error);
      });
    });

    it('should fail to connect with invalid token', done => {
      client = io('http://localhost:3001', {
        auth: {
          token: 'invalid-token',
        },
      });

      client.on('connect_error', error => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.on('connect', () => {
        done(new Error('Should not have connected'));
      });
    });
  });

  describe('WebSocket Authentication', () => {
    beforeEach(done => {
      client = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        done();
      });
    });

    it('should authenticate with explicit userId', done => {
      const authClient = io('http://localhost:3001', {
        auth: {
          userId: userId,
        },
      });

      authClient.on('connect', () => {
        expect(authClient.connected).toBe(true);
        authClient.disconnect();
        done();
      });

      authClient.on('connect_error', error => {
        done(error);
      });
    });

    it('should handle manual authentication', done => {
      client.emit('authenticate', { userId: userId });

      client.on('authenticated', () => {
        done();
      });

      client.on('authentication_error', error => {
        done(error);
      });
    });
  });

  describe('WebSocket Notifications', () => {
    beforeEach(done => {
      client = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        done();
      });
    });

    it('should receive task created notification', done => {
      client.on('task:created', data => {
        expect(data).toBeDefined();
        expect(data.type).toBe('TASK_CREATED');
        done();
      });

      app
        .getHttpServer()
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'WebSocket Test Task',
          description: 'This task should trigger a WebSocket notification',
          priority: 'HIGH',
          status: 'TODO',
          deadline: '2024-12-31T23:59:59.000Z',
        })
        .expect(201);
    });

    it('should receive comment created notification', done => {
      let taskId: string;

      app
        .getHttpServer()
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Comment Test Task',
          description: 'This task will have comments',
          priority: 'MEDIUM',
          status: 'TODO',
          deadline: '2024-12-31T23:59:59.000Z',
        })
        .expect(201)
        .then(response => {
          taskId = response.body.task.id;

          client.on('comment:new', data => {
            expect(data).toBeDefined();
            expect(data.type).toBe('COMMENT_CREATED');
            done();
          });

          app
            .getHttpServer()
            .post(`/api/tasks/${taskId}/comments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              content: 'This comment should trigger a WebSocket notification',
            })
            .expect(201);
        });
    });

    it('should receive task updated notification', done => {
      let taskId: string;

      app
        .getHttpServer()
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Update Test Task',
          description: 'This task will be updated',
          priority: 'LOW',
          status: 'TODO',
          deadline: '2024-12-31T23:59:59.000Z',
        })
        .expect(201)
        .then(response => {
          taskId = response.body.task.id;

          client.on('task:updated', data => {
            expect(data).toBeDefined();
            expect(data.type).toBe('TASK_UPDATED');
            done();
          });

          app
            .getHttpServer()
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              title: 'Updated WebSocket Test Task',
              status: 'IN_PROGRESS',
            })
            .expect(200);
        });
    });

    it('should receive task status changed notification', done => {
      let taskId: string;

      app
        .getHttpServer()
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Status Test Task',
          description: 'This task status will be changed',
          priority: 'HIGH',
          status: 'TODO',
          deadline: '2024-12-31T23:59:59.000Z',
        })
        .expect(201)
        .then(response => {
          taskId = response.body.task.id;

          client.on('task:status', data => {
            expect(data).toBeDefined();
            expect(data.type).toBe('TASK_STATUS_CHANGED');
            done();
          });

          app
            .getHttpServer()
            .put(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              status: 'DONE',
            })
            .expect(200);
        });
    });
  });

  describe('WebSocket Error Handling', () => {
    it('should handle connection errors gracefully', done => {
      client = io('http://localhost:3001', {
        auth: {
          token: 'invalid-token',
        },
      });

      client.on('connect_error', error => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client.on('connect', () => {
        done(new Error('Should not have connected'));
      });
    });

    it('should handle disconnection gracefully', done => {
      client = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        client.disconnect();
      });

      client.on('disconnect', () => {
        expect(client.connected).toBe(false);
        done();
      });
    });
  });

  describe('WebSocket Room Management', () => {
    beforeEach(done => {
      client = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client.on('connect', () => {
        done();
      });
    });

    it('should join user room automatically', done => {
      expect(client.connected).toBe(true);
      done();
    });

    it('should handle multiple clients for same user', done => {
      const client2 = io('http://localhost:3001', {
        auth: {
          token: accessToken,
        },
      });

      client2.on('connect', () => {
        expect(client2.connected).toBe(true);
        client2.disconnect();
        done();
      });

      client2.on('connect_error', error => {
        done(error);
      });
    });
  });
});
