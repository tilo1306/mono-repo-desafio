export const isProd = (nodeEnv?: string) => (nodeEnv || process.env.NODE_ENV) === "production";
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class RpcErrorHelper {
  static NotFoundException(message: string) {
    return {
      statusCode: 404,
      message: message,
      error: 'Not Found',
    };
  }

  static UnauthorizedException(message: string) {
    return {
      statusCode: 401,
      message: message,
      error: 'Unauthorized',
    };
  }

  static BadRequestException(message: string) {
    return {
      statusCode: 400,
      message: message,
      error: 'Bad Request',
    };
  }

  static ConflictException(message: string) {
    return {
      statusCode: 409,
      message: message,
      error: 'Conflict',
    };
  }

  static InternalServerErrorException(message: string) {
    return {
      statusCode: 500,
      message: message,
      error: 'Internal Server Error',
    };
  }

  static ForbiddenException(message: string) {
    return {
      statusCode: 403,
      message: message,
      error: 'Forbidden',
    };
  }

  static TooManyRequestsException(message: string) {
    return {
      statusCode: 429,
      message: message,
      error: 'Too Many Requests',
    };
  }
}
