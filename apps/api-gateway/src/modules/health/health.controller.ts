import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { firstValueFrom, timeout } from 'rxjs';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientProxy,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the API Gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            auth_service: { type: 'string', example: 'up' },
            tasks_service: { type: 'string', example: 'up' },
          },
        },
        error: { type: 'object', example: {} },
        details: {
          type: 'object',
          properties: {
            auth_service: { type: 'string', example: 'up' },
            tasks_service: { type: 'string', example: 'up' },
          },
        },
      },
    },
  })
  async check() {
    const healthChecks = {
      auth_service: 'down',
      tasks_service: 'down',
    };

    const errors = {};

    try {
      await firstValueFrom(
        this.authClient.send('health', {}).pipe(timeout(5000)),
      );
      healthChecks.auth_service = 'up';
    } catch (error) {
      errors['auth_service'] =
        error instanceof Error ? error.message : 'Connection failed';
    }

    try {
      await firstValueFrom(
        this.tasksClient.send('health', {}).pipe(timeout(5000)),
      );
      healthChecks.tasks_service = 'up';
    } catch (error) {
      errors['tasks_service'] =
        error instanceof Error ? error.message : 'Connection failed';
    }

    const overallStatus = Object.values(healthChecks).every(
      status => status === 'up',
    )
      ? 'ok'
      : 'error';

    return {
      status: overallStatus,
      info: healthChecks,
      error: errors,
      details: healthChecks,
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Returns if the service is ready to accept requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'string', example: '2025-10-08T22:50:00.000Z' },
      },
    },
  })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Returns if the service is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        uptime: { type: 'number', example: 123.456 },
        timestamp: { type: 'string', example: '2025-10-08T22:50:00.000Z' },
      },
    },
  })
  live() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
