import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Reservaya API',
      version: '1.0.0',
      description: 'API para el sistema de reservas de parrillas Reservaya',
      contact: {
        name: 'Reservaya',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Owner: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            departmentCode: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tower: { type: 'string' },
            floor: { type: 'string' },
            apartment: { type: 'string' },
            departmentCode: { type: 'string' },
            owner: { $ref: '#/components/schemas/Owner' },
          },
        },
        Grill: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            tower: { type: 'string' },
            description: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
            },
            userId: { type: 'string', format: 'uuid' },
            grillId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
            grill: { $ref: '#/components/schemas/Grill' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de usuarios' },
      { name: 'Grills', description: 'Gestión de parrillas' },
      { name: 'Reservations', description: 'Gestión de reservas' },
      { name: 'Health', description: 'Estado del servidor' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Verificar estado del servidor',
          responses: {
            200: {
              description: 'Servidor funcionando correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Autentica un usuario por torre, piso y departamento. Si no existe un propietario registrado, indica que necesita registro.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tower', 'floor', 'apartment'],
                  properties: {
                    tower: { type: 'string', example: 'A' },
                    floor: { type: 'string', example: '10' },
                    apartment: { type: 'string', example: '1' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso o requiere registro',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          needsRegistration: { type: 'boolean', example: false },
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          needsRegistration: { type: 'boolean', example: true },
                          departmentCode: { type: 'string' },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              tower: { type: 'string' },
                              floor: { type: 'string' },
                              apartment: { type: 'string' },
                              departmentCode: { type: 'string' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Datos de entrada inválidos',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          responses: {
            200: {
              description: 'Sesión cerrada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Sesión cerrada' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register-owner': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar propietario',
          description: 'Registra un nuevo propietario para un departamento',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['firstName', 'lastName', 'email', 'phone', 'departmentCode'],
                  properties: {
                    firstName: { type: 'string', example: 'Juan' },
                    lastName: { type: 'string', example: 'Pérez' },
                    email: { type: 'string', format: 'email', example: 'juan@email.com' },
                    phone: { type: 'string', example: '+56912345678' },
                    departmentCode: { type: 'string', example: '1001A' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Propietario registrado exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Owner' },
                },
              },
            },
            400: {
              description: 'Ya existe un propietario con este email o departamento',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/owner/{departmentCode}': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener propietario por código de departamento',
          parameters: [
            {
              name: 'departmentCode',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: '1001A',
            },
          ],
          responses: {
            200: {
              description: 'Propietario encontrado o null si no existe',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/Owner' },
                      { type: 'null' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Información del usuario autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/grills': {
        get: {
          tags: ['Grills'],
          summary: 'Obtener todas las parrillas',
          responses: {
            200: {
              description: 'Lista de parrillas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Grill' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/grills/{id}': {
        get: {
          tags: ['Grills'],
          summary: 'Obtener parrilla por ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Parrilla encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Grill' },
                },
              },
            },
            404: {
              description: 'Parrilla no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/grills/{id}/availability': {
        get: {
          tags: ['Grills'],
          summary: 'Verificar disponibilidad de parrilla',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'date',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date' },
              example: '2024-12-25',
            },
          ],
          responses: {
            200: {
              description: 'Estado de disponibilidad',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      available: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Fecha requerida',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations': {
        get: {
          tags: ['Reservations'],
          summary: 'Obtener todas las reservas',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de reservas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reservation' },
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Reservations'],
          summary: 'Crear una reserva',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['grillId', 'date'],
                  properties: {
                    grillId: { type: 'string', format: 'uuid' },
                    date: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Reserva creada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reservation' },
                },
              },
            },
            400: {
              description: 'La parrilla ya está reservada para esta fecha',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations/user/{userId}': {
        get: {
          tags: ['Reservations'],
          summary: 'Obtener reservas de un usuario',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de reservas del usuario',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reservation' },
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            403: {
              description: 'No autorizado (solo puede ver sus propias reservas)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations/grill/{grillId}': {
        get: {
          tags: ['Reservations'],
          summary: 'Obtener reservas de una parrilla',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'grillId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Lista de reservas de la parrilla',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reservation' },
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations/{id}': {
        patch: {
          tags: ['Reservations'],
          summary: 'Actualizar una reserva',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date-time' },
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Reserva actualizada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reservation' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            403: {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            404: {
              description: 'Reserva no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Reservations'],
          summary: 'Cancelar una reserva',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Reserva cancelada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Reserva cancelada' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            403: {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            404: {
              description: 'Reserva no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations/{id}/approve': {
        patch: {
          tags: ['Reservations'],
          summary: 'Aprobar una reserva',
          description: 'Endpoint de administrador para aprobar reservas',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Reserva aprobada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reservation' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/reservations/{id}/reject': {
        patch: {
          tags: ['Reservations'],
          summary: 'Rechazar una reserva',
          description: 'Endpoint de administrador para rechazar reservas',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            200: {
              description: 'Reserva rechazada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reservation' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
