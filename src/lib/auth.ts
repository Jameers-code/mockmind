import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
    }),
    CredentialsProvider({
      name: "Developer / Bypass Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "candidate@grillai.io" },
        name: { label: "Name", type: "text", placeholder: "Candidate One" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const email = credentials.email;
        const name = credentials.name || "Candidate One";
        
        try {
          // Upsert developer user
          const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: {
              email,
              name,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            },
          });
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatar,
          };
        } catch (error) {
          console.warn("Database unavailable during sign in (Vercel read-only SQLite fallback):", error);
          // Return a mock user object directly so authentication works on Vercel serverless functions
          return {
            id: "mock-vercel-user-id-" + Date.now(),
            name: name,
            email: email,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      try {
        // Upsert user in database
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name || undefined,
            avatar: user.image || undefined,
          },
          create: {
            email: user.email,
            name: user.name || "Candidate",
            avatar: user.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || "User")}`,
          },
        });
        
        // Add ID to token in next callbacks
        user.id = dbUser.id;
        return true;
      } catch (error) {
        console.warn("Prisma callback upsert bypassed:", error);
        // Ensure user has a valid fallback id so session doesn't fail
        if (!user.id) {
          user.id = "mock-vercel-user-id-" + Date.now();
        }
        return true; // Allow sign in to succeed on Vercel
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
