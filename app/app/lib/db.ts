import { PrismaClient } from '../generated/prisma/index';

//  create schema and migrate your db , create your client  before this
export const prismaClient = new PrismaClient();

//  this is not good or best way that we should introduce a singleton here




