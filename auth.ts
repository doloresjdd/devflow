import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email repo admin:repo_hook" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Upsert user on login
        const user = await prisma.user.upsert({
          where: { email: token.email ?? "" },
          create: {
            email: token.email,
            name: token.name,
            image: token.picture,
          },
          update: {
            name: token.name,
            image: token.picture,
          },
        });

        // Save access token in Account table
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: "github",
              providerAccountId: String(account.providerAccountId),
            },
          },
          create: {
            userId: user.id,
            type: "oauth",
            provider: "github",
            providerAccountId: String(account.providerAccountId),
            access_token: account.access_token,
            scope: account.scope,
          },
          update: {
            access_token: account.access_token,
          },
        });

        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
