// Mock Prisma client
export const prisma = {
  problem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  submission: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  userProgress: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    upsert: jest.fn(),
  },
  studyPlan: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}
