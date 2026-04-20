import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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

      return token;
    },
    async session({ session, token }) {
      session.backendAccessToken = token.backendAccessToken as
        | string
        | undefined;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
