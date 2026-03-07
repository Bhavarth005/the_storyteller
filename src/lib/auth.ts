import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isSignUp: { label: "Sign Up", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const existing = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        // Sign-up flow: create the user if they don't exist
        if (credentials.isSignUp === "true") {
          if (existing) {
            throw new Error("An account with this email already exists.");
          }
          if (password.length < 6) {
            throw new Error("Password must be at least 6 characters.");
          }
          const hash = await bcrypt.hash(password, 10);
          const [created] = await db
            .insert(users)
            .values({ email, passwordHash: hash, name: email.split("@")[0] })
            .returning();
          return { id: created.id, email: created.email, name: created.name };
        }

        // Sign-in flow
        if (!existing || !existing.passwordHash) return null;

        const valid = await bcrypt.compare(password, existing.passwordHash);
        if (!valid) return null;

        return {
          id: existing.id,
          email: existing.email,
          name: existing.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
