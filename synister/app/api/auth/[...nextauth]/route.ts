import NextAuth, { SessionStrategy } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@/app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "database" as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = async (req: NextRequest, res: NextResponse) => {
  try {
    return await NextAuth(authOptions)(req, res);
  } catch (error) {
    console.error('NextAuth error:', error);
    throw error;
  }
};

export { handler as GET, handler as POST };
