import { PrismaClient } from '../generated/prisma/index';
import { withAccelerate } from '@prisma/extension-accelerate'

//  create schema and migrate your db , create your client  before this
export const prismaClient = new PrismaClient().$extends(withAccelerate());

//  this is not good or best way that we should introduce a singleton here




