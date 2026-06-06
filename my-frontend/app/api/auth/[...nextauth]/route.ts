import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isTokenExpired } from "@/lib/jwt";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // On first Google sign-in, exchange Google id_token for backend JWT
      if (account?.provider === "google" && account.id_token) {
        try {
          const apiBase =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

          const res = await fetch(`${apiBase}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          });

          if (res.ok) {
            const data = (await res.json()) as { access_token?: string };
            if (data.access_token) {
              token.backendAccessToken = data.access_token;
            }
          }
        } catch {
          // ignore: keep NextAuth session even if backend is offline
        }
      }

      if (token.backendAccessToken && isTokenExpired(token.backendAccessToken as string)) {
        token.backendAccessToken = undefined;
        delete (token as any).backendUserId;
        delete (token as any).backendUsername;
        delete (token as any).backendRole;
      }

      return token;
    },
    async session({ session, token }) {
      session.backendAccessToken = token.backendAccessToken as
        | string
        | undefined;
      
      if (!token.backendAccessToken) {
        delete (session as any).backendUserId;
        delete (session as any).backendUsername;
        delete (session as any).backendRole;
      } else {
        (session as any).backendUserId = (token as any).backendUserId;
        (session as any).backendUsername = (token as any).backendUsername;
        (session as any).backendRole = (token as any).backendRole;
      }
      return session;
    },
  },
});


export { handler as GET, handler as POST };
